const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const chabi = process.env.jwt_token;
const sessionIdToUserMap = new Map(); // For storing refresh tokens if needed

function setUser(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    chabi,
    { expiresIn: "8h" } // Token expires in 8 hours for better security
  );
}

function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, chabi);
  } catch (error) {
    return null;
  }
}

function logoutUser(id) {
  sessionIdToUserMap.delete(id);
}

module.exports = { setUser, getUser, logoutUser };
