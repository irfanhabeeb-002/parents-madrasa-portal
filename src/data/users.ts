export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export const users: User[] = [
  {
    id: '1',
    name: 'Abdul Rahman',
    phone: '9876543210',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Fatima',
    phone: '9123456780',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Muhammad',
    phone: '9012345678',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Irfan',
    phone: '7025021695',
    createdAt: new Date().toISOString()
  }
];

export const findUserByPhone = (phone: string): User | undefined => {
  // Clean phone number (remove spaces, special chars)
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
  return users.find(user => user.phone === cleanPhone);
};