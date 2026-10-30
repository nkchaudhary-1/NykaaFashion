/**
 * A mobile number as typed or pasted: digits only, with a pasted "+91 …" dropped to its ten digits. The fields filter and trim in
 * their change handler instead of setting maxLength, because the browser cuts pasted text to maxLength *before* it can be cleaned
 * ("+91 98765 43210" would arrive as "+91 98765 ").
 */
export const mobileDigits = (raw: string) => raw.replace(/^\s*\+91/, "").replace(/\D/g, "").slice(0, 10);
