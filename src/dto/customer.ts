// Rolled back: Formik/Yup removed; keep minimal placeholders for any stray imports.
export type CustomerFormValues = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cpf?: string;
};
export const emptyCustomerFormValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  cpf: "",
};
export const customerFormSchema: any = null;
