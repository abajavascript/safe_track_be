const { db } = require("../firebaseConfig");

const saveResponse = async (responseData) => {
  try {
    const responseRef = db.collection("responses").doc();
    await responseRef.set(responseData);
  } catch (error) {
    throw new Error("Failed to save response: " + error.message);
  }
};

module.exports = { saveResponse };
