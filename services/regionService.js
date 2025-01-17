const { db } = require("../firebaseConfig");

const getRegions = async () => {
  const snapshot = await db.collection("regions").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const addRegion = async (data) => {
  const newRegionRef = db.collection("regions").doc();
  await newRegionRef.set(data);
  return { id: newRegionRef.id, ...data };
};

const updateRegion = async (id, data) => {
  await db.collection("regions").doc(id).update(data);
};

const deleteRegion = async (id) => {
  await db.collection("regions").doc(id).delete();
};

module.exports = { getRegions, addRegion, updateRegion, deleteRegion };
