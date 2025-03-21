const units = [
  {
    unit: "lb",
  },
  {
    unit: "oz",
  },
  {
    unit: "pint",
  },
  {
    unit: "quart",
  },
  {
    unit: "gallon",
  },
  {
    unit: "bushel",
  },
  {
    unit: "peck",
  },
  {
    unit: "crate",
  },
  {
    unit: "basket",
  },
  {
    unit: "bag",
  },
  {
    unit: "box",
  },
  {
    unit: "bunch",
  },
  {
    unit: "dozen",
  },
  {
    unit: "bulb",
  },
  {
    unit: "each",
  },

  {
    unit: "none",
  },
];

const formattedTypes = units.map((product) => ({
  value: product.unit,
  label: product.unit,
}));
const useUnits = () => {
  const getAll = () => formattedTypes;

  const getByValue = (value: string) => {
    return formattedTypes.find((item) => item.value === value);
  };

  return {
    getAll,
    getByValue,
  };
};

export default useUnits;
