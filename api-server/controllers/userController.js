const prisma = require("../prisma/prismaClient");

const handleUserCreateOrLogin = async (req, res) => {
  const { id, email, username } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      const newUser = await prisma.user.create({ data: { id, email, username } });
      console.log("---> New User Created:", email);
      return res.status(200).json(newUser);
    } else {
      console.log("---> User Login:", email);
      return res.status(200).json(existingUser);
    }
  } catch (error) {
    console.error("---> Login Failed:", email);
    console.error("Error processing user info:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  handleUserCreateOrLogin,
};
