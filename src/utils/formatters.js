export function formatPrice(priceInOre) {
    if (!priceInOre) return "0 kr";
    return (priceInOre / 100).toLocaleString('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  