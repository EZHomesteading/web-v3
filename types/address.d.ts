export interface AddressFields {
    street: string;
    city: string;
    state: string;
    zip: string;
    apt?:string
  }
  
  export interface FormValues extends AddressFields {
    name: string | null | undefined;
    email: string | null | undefined;
    phone: string | undefined;
    oldPass?: string;
    newPass?: string;
    verifPass?: string;
    id?: string;
    url?:string;
    location?: any;
    image?:string
  }