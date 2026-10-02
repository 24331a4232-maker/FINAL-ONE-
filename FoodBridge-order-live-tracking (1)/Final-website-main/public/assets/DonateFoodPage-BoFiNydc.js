import { j as e, m as o } from "./vendor-framer-tkBTYy3V.js";
import { r as c } from "./vendor-react-CIZhh1CU.js";

const organizationOptions = [
  { value: "hotel", label: "Hotel" },
  { value: "restaurant", label: "Restaurant" },
  { value: "event", label: "Event / Marriage Hall" },
  { value: "caterer", label: "Caterer" },
  { value: "other", label: "Other" }
];

const categoryOptions = [
  { value: "cooked", label: "Cooked Food" },
  { value: "raw", label: "Raw" },
  { value: "packaged", label: "Packaged" },
  { value: "beverages", label: "Beverages" },
  { value: "bakery", label: "Bakery" },
  { value: "other", label: "Other" }
];

function DonateFoodPage() {
  const [form, setForm] = c.useState({
    donor_name: "",
    organization: "",
    organization_type: "hotel",
    food_name: "",
    category: "cooked",
    food_type: "veg",
    quantity: "",
    quantity_unit: "servings",
    meals_count: "",
    pickup_time: "",
    expiry_time: "",
    preparation_time: "",
    storage_method: "room_temperature",
    food_temperature: "",
    food_condition: "good",
    address: "",
    city: "",
    description: "",
    contact_phone: "",
    is_urgent: false,
    image_url: ""
  });
  const [submitted, setSubmitted] = c.useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const donation = {
      ...form,
      submitted_at: new Date().toISOString()
    };

    try {
      localStorage.setItem("foodbridge_latest_donation", JSON.stringify(donation));
      window.dispatchEvent(new CustomEvent("foodbridge_donation_created", { detail: donation }));
    } catch (error) {
      console.warn("Donation submission fallback", error);
    }

    setSubmitted(true);
  };

  if (submitted) {
    return e.jsx("div", {
      className: "pt-20 min-h-screen flex items-center justify-center px-4 gradient-bg-soft",
      children: e.jsxs(o.div, {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        className: "glass-card p-10 text-center max-w-md",
        children: [
          e.jsx(o.div, {
            initial: { scale: 0 },
            animate: { scale: 1 },
            transition: { delay: 0.2, type: "spring", stiffness: 200 },
            className: "h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/40",
            children: e.jsx("div", { className: "text-3xl text-white", children: "✓" })
          }),
          e.jsx("h2", { className: "font-display text-2xl font-bold mb-3", children: "Thank You!" }),
          e.jsx("p", { className: "text-ink-soft dark:text-cream/60 mb-4", children: "Your donation has been listed. Nearby volunteers will be notified to pick it up soon." }),
          e.jsxs("div", {
            className: "flex flex-col gap-3",
            children: [
              e.jsx("a", {
                href: "/services/available-food",
                className: "btn-primary inline-flex items-center justify-center",
                children: "View Available Food"
              }),
              e.jsx("button", {
                type: "button",
                onClick: () => {
                  setSubmitted(false);
                  setForm((prev) => ({
                    ...prev,
                    food_name: "",
                    quantity: "",
                    description: "",
                    meals_count: ""
                  }));
                },
                className: "btn-ghost",
                children: "Donate More"
              })
            ]
          })
        ]
      })
    });
  }

  return e.jsxs("div", {
    className: "pt-20 min-h-screen gradient-bg-soft",
    children: [
      e.jsxs("section", {
        className: "py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto",
        children: [
          e.jsxs("div", {
            className: "text-center mb-10",
            children: [
              e.jsx("span", {
                className: "badge bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mb-4 border border-primary-200/50 dark:border-primary-800/50",
                children: "Make a Difference"
              }),
              e.jsx("h1", {
                className: "font-display text-3xl sm:text-4xl lg:text-5xl font-bold",
                children: "Donate Surplus Food"
              }),
              e.jsx("p", {
                className: "text-ink-soft dark:text-cream/60 mt-3 max-w-xl mx-auto",
                children: "List your surplus food and our volunteer network will redistribute it to those in need."
              })
            ]
          }),
          e.jsxs("form", {
            onSubmit: handleSubmit,
            className: "glass-card p-6 sm:p-8 space-y-6",
            children: [
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Your Name *" }),
                      e.jsx("input", { name: "donor_name", value: form.donor_name, onChange: handleChange, className: "input-field", placeholder: "John Doe" })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Contact Phone" }),
                      e.jsx("input", { name: "contact_phone", value: form.contact_phone, onChange: handleChange, className: "input-field", placeholder: "+91 98765 43210" })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Organization Name *" }),
                      e.jsx("input", { name: "organization", value: form.organization, onChange: handleChange, className: "input-field", placeholder: "The Grand Hotel", required: true })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Organization Type *" }),
                      e.jsx("select", {
                        name: "organization_type",
                        value: form.organization_type,
                        onChange: handleChange,
                        className: "input-field",
                        children: organizationOptions.map((option) => e.jsx("option", { value: option.value, children: option.label }, option.value))
                      })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Food Name *" }),
                      e.jsx("input", { name: "food_name", value: form.food_name, onChange: handleChange, className: "input-field", placeholder: "Biryani & Curry", required: true })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Food Category *" }),
                      e.jsx("select", {
                        name: "category",
                        value: form.category,
                        onChange: handleChange,
                        className: "input-field",
                        children: categoryOptions.map((option) => e.jsx("option", { value: option.value, children: option.label }, option.value))
                      })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Food Type (Veg / Non-Veg) *" }),
                      e.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                        e.jsxs("button", {
                          type: "button",
                          onClick: () => setForm((prev) => ({ ...prev, food_type: "veg" })),
                          className: `flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${form.food_type === "veg" ? "bg-green-500 text-white shadow-lg" : "bg-oat dark:bg-secondary-800/50 text-ink-soft dark:text-cream/70 hover:bg-green-50"}`,
                          children: ["Vegetarian"]
                        }),
                        e.jsxs("button", {
                          type: "button",
                          onClick: () => setForm((prev) => ({ ...prev, food_type: "non_veg" })),
                          className: `flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${form.food_type === "non_veg" ? "bg-red-500 text-white shadow-lg" : "bg-oat dark:bg-secondary-800/50 text-ink-soft dark:text-cream/70 hover:bg-red-50"}`,
                          children: ["Non-Veg"]
                        })
                      ]})
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Number of Meals" }),
                      e.jsx("input", { type: "number", name: "meals_count", value: form.meals_count, onChange: handleChange, className: "input-field", placeholder: "e.g. 25", min: "0" })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
                children: [
                  e.jsxs("div", { className: "sm:col-span-1", children: [
                    e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Quantity *" }),
                    e.jsx("input", { name: "quantity", value: form.quantity, onChange: handleChange, className: "input-field", placeholder: "50", required: true })
                  ]}),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Unit" }),
                      e.jsx("select", {
                        name: "quantity_unit",
                        value: form.quantity_unit,
                        onChange: handleChange,
                        className: "input-field",
                        children: [
                          e.jsx("option", { value: "servings", children: "Servings" }),
                          e.jsx("option", { value: "kg", children: "Kilograms" }),
                          e.jsx("option", { value: "packets", children: "Packets" }),
                          e.jsx("option", { value: "boxes", children: "Boxes" })
                        ]
                      })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Storage Method" }),
                      e.jsx("select", {
                        name: "storage_method",
                        value: form.storage_method,
                        onChange: handleChange,
                        className: "input-field",
                        children: [
                          e.jsx("option", { value: "room_temperature", children: "Room Temperature" }),
                          e.jsx("option", { value: "refrigerated", children: "Refrigerated" }),
                          e.jsx("option", { value: "frozen", children: "Frozen" })
                        ]
                      })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Pickup Time *" }),
                      e.jsx("input", { type: "datetime-local", name: "pickup_time", value: form.pickup_time, onChange: handleChange, className: "input-field", required: true })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Expiry Time *" }),
                      e.jsx("input", { type: "datetime-local", name: "expiry_time", value: form.expiry_time, onChange: handleChange, className: "input-field", required: true })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Preparation Time" }),
                      e.jsx("input", { type: "datetime-local", name: "preparation_time", value: form.preparation_time, onChange: handleChange, className: "input-field" })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Food Temperature (°C)" }),
                      e.jsx("input", { name: "food_temperature", value: form.food_temperature, onChange: handleChange, className: "input-field", placeholder: "e.g. 4" })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                children: [
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Location / Address *" }),
                      e.jsx("input", { name: "address", value: form.address, onChange: handleChange, className: "input-field", placeholder: "12 Market Road, Bengaluru", required: true })
                    ]
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "City *" }),
                      e.jsx("input", { name: "city", value: form.city, onChange: handleChange, className: "input-field", placeholder: "Bengaluru", required: true })
                    ]
                  })
                ]
              }),
              e.jsxs("div", {
                children: [
                  e.jsx("label", { className: "block text-sm font-medium mb-1.5", children: "Description" }),
                  e.jsx("textarea", {
                    name: "description",
                    value: form.description,
                    onChange: handleChange,
                    className: "input-field min-h-28 resize-y",
                    placeholder: "Describe the food items, packaging, etc."
                  })
                ]
              }),
              e.jsxs("div", {
                className: "flex flex-col sm:flex-row gap-4 pt-2",
                children: [
                  e.jsx("button", {
                    type: "submit",
                    className: "btn-primary flex-1",
                    children: "List Donation"
                  }),
                  e.jsx("label", { className: "inline-flex items-center gap-2 text-sm text-ink-soft dark:text-cream/70", children: [
                    e.jsx("input", { type: "checkbox", name: "is_urgent", checked: form.is_urgent, onChange: handleChange }),
                    "Urgent donation"
                  ]})
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

export { DonateFoodPage };
