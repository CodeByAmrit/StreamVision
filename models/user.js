const bcrypt = require("bcrypt");
const { setUser } = require("../services/aouth");
const db = require("../config/getConnection"); // Your MySQL db connection wrapper

class User {
    // Create a new user
    static async create({ name, email, password }) {
        const salt = parseInt(process.env.saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
        const values = [name, email, hashedPassword];
        let connection;

        try {
            connection = await db.getConnection();
            const [result] = await connection.execute(query, values);
            const insertedId = result.insertId;

            const [user] = await connection.execute("SELECT id, name, email FROM users WHERE id = ?", [insertedId]);
            return user[0];
        } catch (error) {
            throw new Error("Error creating user: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Get all users
    static async findAll() {
        const query = `SELECT id, name, email FROM users`;
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(query);
            return rows;
        } catch (error) {
            throw new Error("Error fetching users: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Get a single user by ID
    static async findById(id) {
        const query = `SELECT * FROM users WHERE id = ?`;
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error("Error fetching user: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Get a single user by email
    static async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = ?`;
        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(query, [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error("Error fetching user: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Update a user
    static async update(id, { name, email }) {
        const query = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
        let connection;
        try {
            connection = await db.getConnection();
            await connection.execute(query, [name, email, id]);
            return await this.findById(id);
        } catch (error) {
            throw new Error("Error updating user: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Update user password
    static async updatePassword(id, password) {
        let connection;
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.saltRounds));
        const query = `UPDATE users SET password = ? WHERE id = ?`;
        
        try {
            connection = await db.getConnection();
            await connection.execute(query, [hashedPassword, id]);
            return await this.findById(id);
        } catch (error) {
            throw new Error("Error updating password: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Delete user
    static async delete(id) {
        const query = `DELETE FROM users WHERE id = ?`;

        let connection;
        try {
            connection = await db.getConnection();
            const [result] = await connection.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error("Error deleting user: " + error.message);
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }

    // Login user
    static async login(req, res) {
        try {
            let { email, password } = req.body;
            email = email?.trim().toLowerCase();
            
            const user = await this.findByEmail(email);
            if (!user) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return res.status(401).json({ status: 'Invalid email' });
            }

            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.status(403).json({ status: 'Invalid Password' });
            }

            const token = setUser(user);
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 3600000,
            });

            res.json({ status: 'success', token });

        } catch (error) {
            throw new Error("Error Login User: " + error.message);
        }
    }

    // Logout
    static async logout(req, res) {
        try {
            res.clearCookie("token").redirect("/login");
        } catch (error) {
            throw new Error("Error Logout User: " + error.message);
        }
    }
}

module.exports = User;
