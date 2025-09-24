export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export const users: User[] = [
  {
    id: '1',
    name: 'Abdul Shukkoor',
    phone: '8078769771',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Muneer Jabbar',
    phone: '9400095648',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Sageer Manath',
    phone: '9388839617',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Rafeek M I',
    phone: '9387110300',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Yousuf B S',
    phone: '9895820756',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Irfan Habeeb',
    phone: '7025021695',
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Abdul Rasheed',
    phone: '9447183133',
    createdAt: new Date().toISOString(),
  },
];

export const findUserByPhone = (phone: string): User | undefined => {
  // Clean phone number (remove spaces, special chars)
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
  return users.find(user => user.phone === cleanPhone);
};
