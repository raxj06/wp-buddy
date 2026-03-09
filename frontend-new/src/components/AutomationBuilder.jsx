import React from 'react';
import Layout from './Layout';

const AutomationBuilder = () => {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900  mb-6">Automation Builder</h1>
                <div className="bg-white  rounded-2xl p-12 text-center border border-dashed border-gray-300 ">
                    <div className="w-16 h-16 bg-orange-100  rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 ">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900  mb-2">Automation Builder Coming Soon</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Build powerful automated flows for your customers using our visual builder.</p>
                </div>
            </div>
        </Layout>
    );
};

export default AutomationBuilder;
