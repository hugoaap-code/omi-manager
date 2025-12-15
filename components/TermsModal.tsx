import React from 'react';
import { Icons } from './Icons';

interface TermsModalProps {
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                            <Icons.FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Terms of Service</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Icons.Close className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700 dark:text-gray-300">

                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Independent Service</h3>
                        <p className="text-sm leading-relaxed">
                            Limitless Manager is an independent application and is <strong>not affiliated with, endorsed by, or connected to Limitless.ai</strong> in any way. This is a third-party tool designed to help you manage and organize your data from the Limitless platform.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Security & Privacy</h3>
                        <p className="text-sm leading-relaxed mb-3">
                            Your data security and privacy are our top priorities:
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <Icons.CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span><strong>Google Cloud Infrastructure:</strong> All data is securely stored on Google Cloud servers using Firebase/Firestore.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icons.CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span><strong>Encryption:</strong> Your data is encrypted both in transit and at rest.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icons.CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span><strong>No Third-Party Access:</strong> Only you can access your data. We do not share, sell, or access your information.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icons.CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span><strong>API Token Security:</strong> Your Limitless API token is stored securely in your user profile and is never exposed to third parties.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Data Control & Deletion</h3>
                        <p className="text-sm leading-relaxed">
                            You have full control over your data at all times. You can delete your account and all associated data instantly through the app settings. Once deleted, your data is permanently removed from our servers and cannot be recovered.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Usage Responsibility</h3>
                        <p className="text-sm leading-relaxed">
                            By using this service, you agree to use it responsibly and in compliance with all applicable laws. You are responsible for maintaining the security of your account credentials and API tokens.
                        </p>
                    </section>

                    <section className="pt-4 border-t border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated: November 2025
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};
