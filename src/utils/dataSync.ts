export const exportAllData = () => {
  const data: Record<string, any> = {};

  const keys = [
    "customers",
    "orders",
    "cards",
    "creditCards",
    "addresses",
    "coupons",
    "exchanges",
    "session",
    "cart",
    "appliedCoupons",
    "chatHistory",
  ];

  keys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pokestore-data-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importAllData = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        Object.keys(data).forEach((key) => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });

        window.location.reload();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const clearAllData = () => {
  if (
    confirm(
      "Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita."
    )
  ) {
    localStorage.clear();
    window.location.reload();
  }
};
