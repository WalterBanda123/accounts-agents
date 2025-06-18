export interface UserInterface {
    id: string,
    name: string,
    email: string,
    businessName: string,
    phone: string,
    profileImage?: string
}

export interface UserProfile {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    language_preference: string; // "English", etc.
    location: string; // "Zimbabwe", etc.
    created_at?: string; // ISO date string
    business_owner: boolean;
    preferred_currency: string; // "USD", "ZWL", etc.
}

export interface StoreProfile {
    store_id: string;
    user_id: string; // Links to user profile
    store_name: string;
    business_type: string;
    business_size: "small" | "medium" | "large";
    currency: string;
    tax_rate: number;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
    location: {
        address: string;
        city: string;
        country: string;
    };
    contact: {
        phone: string;
        email: string;
    };
    industry_profile: {
        product_categories: string[];
        common_brands: string[];
    };
}