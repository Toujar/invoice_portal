import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoicesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import InvoiceForm from '../components/InvoiceForm';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function EditInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    invoicesAPI.getOne(id)
      .then((res) => setInvoice(res.invoice))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (error)   return <Alert type="error" message={error} />;

  return (
    <div>
      <PageHeader
        title={`Edit Invoice ${invoice?.invoice_number}`}
        subtitle="Update the invoice details below"
      />
      <InvoiceForm existingInvoice={invoice} />
    </div>
  );
}
