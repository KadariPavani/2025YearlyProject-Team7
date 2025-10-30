exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    // Your feedback logic here
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
