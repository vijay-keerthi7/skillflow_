import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
    // .sign() is the predefined method from the library
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // The token will be valid for 30 days
    });
};