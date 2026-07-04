// src/services/investor.service.ts
import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/services/distributor.service";

export const investorService = {
  getPortfolio: async () => {
    return apiClient.get<any>("/investors/holdings");
  },


  getSystematicReport: async (data: {
    type?: string;
    status?: string;
    registrar?: string;
  }) => {
    return apiClient.post<any>("/my-portfolio/systematic-report", data);
  },
};
