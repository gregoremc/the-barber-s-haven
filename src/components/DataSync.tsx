import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { barbersStore } from "@/data/barbersStore";
import { appointmentsStore } from "@/data/appointmentsStore";
import { servicesStore } from "@/data/servicesStore";
import { paymentsStore } from "@/data/paymentsStore";
import { billsStore } from "@/data/billsStore";
import { productsStore } from "@/data/productsStore";
import { suppliersStore } from "@/data/suppliersStore";
import { clientsStore } from "@/data/clientsStore";
import { revenueStore } from "@/data/revenueStore";
import { shopStore } from "@/data/shopStore";
import { trashStore } from "@/data/trashStore";

const DataSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Load all stores in parallel
      Promise.all([
        barbersStore.setUserId(user.id),
        appointmentsStore.setUserId(user.id),
        servicesStore.setUserId(user.id),
        paymentsStore.setUserId(user.id),
        billsStore.setUserId(user.id),
        productsStore.setUserId(user.id),
        suppliersStore.setUserId(user.id),
        clientsStore.setUserId(user.id),
        revenueStore.setUserId(user.id),
        shopStore.setUserId(user.id),
        trashStore.setUserId(user.id),
      ]);
    } else {
      // Clear all stores on logout
      barbersStore.clear();
      appointmentsStore.clear();
      servicesStore.clear();
      paymentsStore.clear();
      billsStore.clear();
      productsStore.clear();
      suppliersStore.clear();
      clientsStore.clear();
      revenueStore.clear();
      shopStore.clear();
      trashStore.clearLocal();
    }
  }, [user]);

  return null;
};

export default DataSync;
