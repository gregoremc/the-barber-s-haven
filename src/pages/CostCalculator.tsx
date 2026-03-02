import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Package, Scissors } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";

const CostCalculator = () => {
  const [productCost, setProductCost] = useState("");
  const [productSellPrice, setProductSellPrice] = useState("");

  const [serviceCost, setServiceCost] = useState("");
  const [barberCommission, setBarberCommission] = useState("");
  const [serviceSellPrice, setServiceSellPrice] = useState("");

  const productMargin = Number(productSellPrice) - Number(productCost);
  const productMarginPercent = Number(productSellPrice) > 0
    ? ((productMargin / Number(productSellPrice)) * 100).toFixed(1)
    : "0";

  const totalServiceCost = Number(serviceCost) + (Number(serviceSellPrice) * Number(barberCommission) / 100);
  const serviceProfit = Number(serviceSellPrice) - totalServiceCost;
  const serviceMarginPercent = Number(serviceSellPrice) > 0
    ? ((serviceProfit / Number(serviceSellPrice)) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Calculadora de Custo</h1>
        <p className="text-muted-foreground font-light mt-1">Simule margens de lucro para produtos e serviços</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Calculator */}
        <MotionContainer>
          <div className="organic-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Package size={18} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <h2 className="section-title !mb-0">Simulador de Produto</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-light mb-1.5 block">Preço de Custo (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                  className="organic-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-light mb-1.5 block">Preço de Venda (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={productSellPrice}
                  onChange={(e) => setProductSellPrice(e.target.value)}
                  className="organic-input"
                />
              </div>
            </div>

            {(Number(productCost) > 0 || Number(productSellPrice) > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="pt-4 border-t border-border/40 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Custo</span>
                  <span className="text-sm font-medium">R$ {Number(productCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Venda</span>
                  <span className="text-sm font-medium">R$ {Number(productSellPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-sm font-medium">Lucro</span>
                  <span className={`text-lg font-medium ${productMargin >= 0 ? "text-success" : "text-destructive"}`}>
                    R$ {productMargin.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Margem</span>
                  <span className={`text-sm font-medium ${productMargin >= 0 ? "text-success" : "text-destructive"}`}>
                    {productMarginPercent}%
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </MotionContainer>

        {/* Service Calculator */}
        <MotionContainer delay={0.05}>
          <div className="organic-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary">
                <Scissors size={18} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <h2 className="section-title !mb-0">Simulador de Serviço</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-light mb-1.5 block">Custo de Execução (R$)</label>
                <input
                  type="number"
                  placeholder="Produtos, materiais, etc."
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  className="organic-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-light mb-1.5 block">Comissão do Barbeiro (%)</label>
                <input
                  type="number"
                  placeholder="Ex: 50"
                  value={barberCommission}
                  onChange={(e) => setBarberCommission(e.target.value)}
                  className="organic-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-light mb-1.5 block">Preço Cobrado (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={serviceSellPrice}
                  onChange={(e) => setServiceSellPrice(e.target.value)}
                  className="organic-input"
                />
              </div>
            </div>

            {(Number(serviceCost) > 0 || Number(serviceSellPrice) > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="pt-4 border-t border-border/40 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Custo de Execução</span>
                  <span className="text-sm font-medium">R$ {Number(serviceCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Comissão Barbeiro ({barberCommission || 0}%)</span>
                  <span className="text-sm font-medium">
                    R$ {(Number(serviceSellPrice) * Number(barberCommission) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Custo Total</span>
                  <span className="text-sm font-medium">R$ {totalServiceCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-sm font-medium">Lucro Líquido</span>
                  <span className={`text-lg font-medium ${serviceProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    R$ {serviceProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-light">Margem</span>
                  <span className={`text-sm font-medium ${serviceProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    {serviceMarginPercent}%
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </MotionContainer>
      </div>
    </div>
  );
};

export default CostCalculator;
