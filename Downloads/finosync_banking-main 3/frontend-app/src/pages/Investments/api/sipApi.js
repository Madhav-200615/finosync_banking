import axios from "../../../utils/axios";

export const createSip = async (payload) => {
    return await axios.post("/sip", payload);
};

export const getMySips = async () => {
    return await axios.get("/sip");
};

export const cancelSip = async (id) => {
    return await axios.post(`/sip/${id}/cancel`);
};
