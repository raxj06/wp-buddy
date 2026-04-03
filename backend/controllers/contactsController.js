const { getContacts, createContact } = require('../db-supabase');
const fs = require('fs');
const { parse } = require('csv-parse');

exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await getContacts(req.user.id);
        res.json({ success: true, contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
    }
};

exports.createContact = async (req, res) => {
    try {
        const { wabaId, phoneNumber, name, email, tags, attributes } = req.body;
        // Basic validation
        if (!wabaId || !phoneNumber) {
            return res.status(400).json({ success: false, error: 'WABA ID and Phone Number are required' });
        }
        const contact = await createContact(req.user.id, wabaId, phoneNumber, name, email, tags, attributes);
        res.status(201).json({ success: true, contact });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ success: false, error: 'Failed to create contact' });
    }
};

exports.uploadContactsCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const { wabaId } = req.body;
    if (!wabaId) {
        fs.unlinkSync(req.file.path); // Clean up
        return res.status(400).json({ success: false, error: 'WABA ID is required' });
    }

    const results = [];
    let processed = 0;
    const errors = [];

    fs.createReadStream(req.file.path)
        .pipe(parse({
            columns: true, // Expect header row
            skip_empty_lines: true,
            trim: true
        }))
        .on('data', (row) => {
            // Mapping common CSV column names
            const phone = row.Phone || row.phone || row['Phone Number'] || row.phoneNumber;
            const name = row.Name || row.name || row['Full Name'];
            const email = row.Email || row.email;

            if (phone) {
                // Keep only digits, +, and -
                const cleanPhone = phone.replace(/[^\d+]/g, ''); 
                if (cleanPhone) {
                    results.push({
                        wabaId,
                        phoneNumber: cleanPhone,
                        name: name || null,
                        email: email || null,
                        tags: ['csv_import'],
                        attributes: {}
                    });
                }
            }
        })
        .on('end', async () => {
            // Delete temp file
            fs.unlinkSync(req.file.path);

            if (results.length === 0) {
                return res.status(400).json({ success: false, error: 'No valid contacts found in CSV. Ensure there is a "phone" column header.' });
            }

            // Bulk insert via helper loop (for now, to reuse createContact logic including upsert checking)
            // Ideally, a bulk helper in db-supabase.js is better for huge lists, but this works for MVP sizes.
            for (const record of results) {
                try {
                    await createContact(
                        req.user.id,
                        record.wabaId,
                        record.phoneNumber,
                        record.name,
                        record.email,
                        record.tags,
                        record.attributes
                    );
                    processed++;
                } catch (err) {
                    errors.push(`Failed for ${record.phoneNumber}: ${err.message}`);
                }
            }

            res.json({
                success: true,
                message: `Processed ${processed} contacts successfully.`,
                errors: errors.length > 0 ? errors : null
            });
        })
        .on('error', (err) => {
            fs.unlinkSync(req.file.path);
            console.error('CSV Parsing Error:', err);
            res.status(500).json({ success: false, error: 'Failed to process CSV file' });
        });
};

exports.updateContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { attributes, tags, name, email } = req.body;
        
        const { updateContactAttributes, addContactTag, getContactById } = require('../db-supabase');
        
        // Ensure user owns this contact
        const existingContact = await getContactById(req.user.id, contactId);
        if (!existingContact) {
            return res.status(404).json({ success: false, error: 'Contact not found or unauthorized' });
        }

        let updatedContact = existingContact;

        if (attributes) {
            updatedContact = await updateContactAttributes(contactId, attributes);
        }

        if (tags && Array.isArray(tags)) {
            // Logic to sync tags if needed
        }

        res.json({ success: true, contact: updatedContact });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ success: false, error: 'Failed to update contact' });
    }
};
