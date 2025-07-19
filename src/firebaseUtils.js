// src/firebaseUtils.js
import { db, ref, push, set, remove, update, onValue } from './firebase';

export const addBus = async (busData) => {
  const busRef = push(ref(db, "all_routes"));
  await set(busRef, busData);
};

export const fetchBuses = (callback) => {
  const busesRef = ref(db, "all_routes");
  onValue(busesRef, snapshot => {
    const data = snapshot.val();
    const buses = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
    callback(buses);
  });
};

export const deleteBus = async (id) => {
  await remove(ref(db, `all_routes/${id}`));
};

export const updateBus = async (id, updatedData) => {
  await update(ref(db, `all_routes/${id}`), updatedData);
};
