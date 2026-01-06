-- Create transaction categories table
CREATE TABLE public.transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text NOT NULL DEFAULT 'hsl(211, 100%, 50%)',
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transactions table (for income and expenses)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount decimal(12,2) NOT NULL,
  description text,
  date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create debts table
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('owed_to_me', 'i_owe')),
  original_amount decimal(12,2) NOT NULL,
  remaining_amount decimal(12,2) NOT NULL,
  description text,
  due_date timestamp with time zone,
  is_settled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create debt payments table for payment history
CREATE TABLE public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  note text,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for transaction_categories
CREATE POLICY "Users can view their own categories" ON public.transaction_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON public.transaction_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.transaction_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.transaction_categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for debts
CREATE POLICY "Users can view their own debts" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own debts" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own debts" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own debts" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for debt_payments (based on parent debt ownership)
CREATE POLICY "Users can view payments for their debts" ON public.debt_payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can create payments for their debts" ON public.debt_payments
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can update payments for their debts" ON public.debt_payments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));
CREATE POLICY "Users can delete payments for their debts" ON public.debt_payments
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.debts WHERE debts.id = debt_payments.debt_id AND debts.user_id = auth.uid()));

-- Insert default categories for new users (using a function triggered on first transaction)
-- Users can create their own categories