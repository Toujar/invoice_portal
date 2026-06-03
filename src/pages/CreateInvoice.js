import React from 'react';
import PageHeader from '../components/PageHeader';
import InvoiceForm from '../components/InvoiceForm';

export default function CreateInvoice() {
  return (
    <div>
      <PageHeader title="New Invoice" subtitle="Fill in the details to create a new invoice" />
      <InvoiceForm />
    </div>
  );
}
