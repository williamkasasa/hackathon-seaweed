export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  image?: string;
}

export interface CartItem {
  id: string;
  quantity: number;
}

export interface Buyer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface Address {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface FulfillmentOption {
  id: string;
  display_name?: string;
  title?: string;
  amount?: number;
  subtotal?: string | number;
  total?: string | number;
  description?: string;
  subtitle?: string;
}

export interface LineItem {
  id: string;
  item: Product;
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Total {
  type: string;
  display_text: string;
  amount: number;
}

export interface CheckoutSession {
  id: string;
  buyer?: Buyer;
  payment_provider?: string;
  status: 'not_ready_for_payment' | 'ready_for_payment' | 'completed' | 'canceled';
  currency: string;
  line_items: LineItem[];
  fulfillment_address?: Address;
  fulfillment_options: FulfillmentOption[];
  fulfillment_option_id?: string;
  totals: Total[];
  messages: string[];
  links: any[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  original_tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface PaymentData {
  payment_token: string;
  payment_provider?: string;
  billing_address?: Address;
}
