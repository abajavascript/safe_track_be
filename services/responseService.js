const { db } = require("../firebaseConfig");

const saveResponse = async (responseData) => {
  try {
    const responseRef = db.collection("responses").doc();
    await responseRef.set(responseData);
  } catch (error) {
    throw new Error("Failed to save response: " + error.message);
  }
};

const getLastResponse = async (uid) => {
  try {
    const responseQuery = await db
      .collection("responses")
      .where("user_uid", "==", uid)
      .orderBy("response_date_time", "desc")
      .limit(1)
      .get();
    if (responseQuery.empty) return null;
    return { ...responseQuery.docs[0].data(), id: responseQuery.docs[0].id };
  } catch (error) {
    throw new Error("Failed to get last response: " + error.message);
  }
};

const getLastRequest = async (uid) => {
  try {
    const requestQuery = await db
      .collection("requests")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    if (requestQuery.empty) return null;
    return { ...requestQuery.docs[0].data(), id: requestQuery.docs[0].id };
  } catch (error) {
    throw new Error("Failed to get last request: " + error.message);
  }
};

const getLastStatus = async (uid) => {
  const lastResponse = await getLastResponse(uid);
  const lastRequest = await getLastRequest(uid);
  return { lastResponse, lastRequest };
};

module.exports = { saveResponse, getLastStatus };
