import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Paper
} from '@mui/material';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';
import { paymentApi } from '../api/paymentApi';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QtzF9RvJ7Vq5F1tH8kQ7J8P4nM9W2qL5sR8T6U9V3X7Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z');

interface StripeCheckoutFormProps {
  appointmentId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  appointmentId,
  amount,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await paymentApi.createPaymentIntent(appointmentId, amount);

        if (response.status === 'success') {
          setClientSecret(response.data.clientSecret);
        } else {
          setError(response.message || 'Failed to initialize payment');
          onError(response.message || 'Failed to initialize payment');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [appointmentId, amount, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setError(submitError.message || 'Payment submission failed');
        onError(submitError.message || 'Payment submission failed');
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?method=stripe&appointmentId=${appointmentId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed');
        onError(confirmError.message || 'Payment confirmation failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment completed successfully
        onSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action or redirect
        console.log('Payment processing or redirect required');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Initializing payment...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Box display="flex" alignItems="center" mb={2}>
          <CreditCardIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Secure Payment with Stripe</Typography>
        </Box>

        <PaymentElement />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={!stripe || loading}
          sx={{
            mt: 3,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Processing Payment...
            </>
          ) : (
            `Pay Rs. ${amount}`
          )}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Your payment information is secure and encrypted
        </Typography>
      </Box>
    </Paper>
  );
};

interface StripeCheckoutProps {
  appointmentId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await paymentApi.createPaymentIntent(props.appointmentId, props.amount);
        if (response.status === 'success') {
          setClientSecret(response.data.clientSecret);
        } else {
          setError(response.message || 'Failed to initialize payment');
          props.onError(response.message || 'Failed to initialize payment');
        }
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to load payment form.';
        setError(message);
        props.onError(message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [props.appointmentId, props.amount]);

  if (loading && !clientSecret) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading payment form...
        </Typography>
      </Box>
    );
  }

  if (error && !clientSecret) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Add your Stripe test keys to <strong>backend/.env</strong> (STRIPE_SECRET_KEY) and <strong>frontend/.env</strong> (VITE_STRIPE_PUBLISHABLE_KEY). Get them from{' '}
          <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
            Stripe Dashboard → API keys
          </a>
        </Typography>
      </Paper>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
};

export default StripeCheckout;