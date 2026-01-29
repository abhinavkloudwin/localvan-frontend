'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';
import type { AdminOwnerKYCCreate, AdminOwnerKYCUpdate, OwnerKYCWithAudit } from '@/lib/types';

interface OwnerKYCFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingKYC?: OwnerKYCWithAudit | null;
}

export function OwnerKYCForm({ isOpen, onClose, onSuccess, editingKYC }: OwnerKYCFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const isEditing = !!editingKYC;

  // Populate form when editing
  useEffect(() => {
    if (editingKYC) {
      setFullName(editingKYC.full_name || '');
      setMobileNumber(editingKYC.mobile_number || '');
      setEmailId(editingKYC.email_id || '');
      setCompanyName(editingKYC.company_name || '');
      setBusinessAddress(editingKYC.business_address || '');
      setCity(editingKYC.city || '');
      setState(editingKYC.state || '');
      setPincode(editingKYC.pincode || '');
      setPanNumber(editingKYC.pan_number || '');
      setGstNumber(editingKYC.gst_number || '');
      setAccountNumber(editingKYC.account_number || '');
      setBankName(editingKYC.bank_name || '');
      setIfscCode(editingKYC.ifsc_code || '');
    } else {
      resetForm();
    }
  }, [editingKYC]);

  const resetForm = () => {
    setFullName('');
    setMobileNumber('');
    setEmailId('');
    setCompanyName('');
    setBusinessAddress('');
    setCity('');
    setState('');
    setPincode('');
    setPanNumber('');
    setGstNumber('');
    setAccountNumber('');
    setBankName('');
    setIfscCode('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditing && editingKYC) {
        // Update existing KYC
        const updateData: AdminOwnerKYCUpdate = {};

        if (fullName) updateData.full_name = fullName;
        if (mobileNumber) updateData.mobile_number = mobileNumber;
        if (emailId) updateData.email_id = emailId;
        if (companyName) updateData.company_name = companyName;
        if (businessAddress) updateData.business_address = businessAddress;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (pincode) updateData.pincode = pincode;
        if (panNumber) updateData.pan_number = panNumber;
        if (gstNumber) updateData.gst_number = gstNumber;
        if (accountNumber) updateData.account_number = accountNumber;
        if (bankName) updateData.bank_name = bankName;
        if (ifscCode) updateData.ifsc_code = ifscCode;

        await apiClient.updateAdminOwnerKYC(editingKYC.id, updateData);
        toast.success('Owner KYC updated successfully');
      } else {
        // Create new KYC - mobile number is required to find/create owner
        if (!mobileNumber) {
          setError('Mobile number is required');
          setLoading(false);
          return;
        }

        const createData: AdminOwnerKYCCreate = {
          mobile_number: mobileNumber,
        };

        if (fullName) createData.full_name = fullName;
        if (emailId) createData.email_id = emailId;
        if (companyName) createData.company_name = companyName;
        if (businessAddress) createData.business_address = businessAddress;
        if (city) createData.city = city;
        if (state) createData.state = state;
        if (pincode) createData.pincode = pincode;
        if (panNumber) createData.pan_number = panNumber;
        if (gstNumber) createData.gst_number = gstNumber;
        if (accountNumber) createData.account_number = accountNumber;
        if (bankName) createData.bank_name = bankName;
        if (ifscCode) createData.ifsc_code = ifscCode;

        await apiClient.createAdminOwnerKYC(createData);
        toast.success('Owner KYC created successfully');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // Check if the error is about existing KYC record
      if (errorMessage.toLowerCase().includes('already has a kyc record') ||
          errorMessage.toLowerCase().includes('owner already has')) {
        toast.error('A KYC record already exists for this mobile number');
      } else {
        toast.error(errorMessage);
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Owner KYC' : 'Create Owner KYC'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="ABCDE1234F"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                maxLength={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                maxLength={11}
                placeholder="ABCD0123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading || (!isEditing && !mobileNumber)}
          >
            {loading ? 'Saving...' : isEditing ? 'Update KYC' : 'Create KYC'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
