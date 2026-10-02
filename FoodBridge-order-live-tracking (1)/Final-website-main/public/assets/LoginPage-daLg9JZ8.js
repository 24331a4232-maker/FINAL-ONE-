import { j as e, m as r } from "./vendor-framer-tkBTYy3V.js";
import {
  u as D,
  d as M,
  r as i,
  N as O,
  L as U,
} from "./vendor-react-CIZhh1CU.js";
import {
  u as W,
  l as T,
  r as w,
  n as N,
  f as c,
  i as f,
  s as z,
  o as _,
  R as G,
  A as H,
} from "./index-foYjuKl0.js";
import { P as J } from "./PageNav-B_cesRfl.js";
import { A as K } from "./at-sign-BRzlTq4g.js";
import { E as Q } from "./eye-off-e7gUi3-m.js";
import { E as V } from "./eye-CyBKk3II.js";
import "./vendor-pdf-BXEbHS64.js";
import "./vendor-supabase-C1HiJvrl.js";
import "./arrow-left-B2jXvQuE.js";
function le() {
  var v;
  const { signIn: k, signOut: h, user: A, profile: g, loading: L } = W(),
    { toast: o } = T(),
    S = D(),
    C = ((v = M().state) == null ? void 0 : v.from) ?? "/",
    [m, b] = i.useState(""),
    [u, j] = i.useState(""),
    [x, E] = i.useState(!1),
    [targetRole, setTargetRole] = i.useState(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("role");
      if (q && ["donor", "volunteer", "restaurant", "ngo", "admin"].includes(q.toLowerCase())) return q.toLowerCase();
    } catch(e) {}
    return "donor";
  }),
  t = targetRole === "admin",
    [F, R] = i.useState(!0),
    [p, y] = i.useState(!1),
    [n, d] = i.useState({});
  if (!L && !p && A && g) return e.jsx(O, { to: w[g.role], replace: !0 });
  const B = () => {
      const s = {};
      return (
        m.trim() ||
          (s.identifier = targetRole === "admin"
            ? "Admin username is required (Foodbridge)"
            : (targetRole.charAt(0).toUpperCase() + targetRole.slice(1) + " email or username is required")),
        u.trim() || (s.password = "Password is required"),
        d(s),
        Object.keys(s).length === 0
      );
    },
    I = () => {
      (P((s) => !s), b(""), j(""), d({}));
    },
    $ = async (s) => {
      if ((s.preventDefault(), !!B())) {
        y(!0);
        try {
          const { error: a, role: l } = await k(m, u);
          if (a) {
            o(a, "error");
          } else if (l !== targetRole) {
            await h();
            const names = {
              donor: "Donor",
              volunteer: "Volunteer",
              restaurant: "Restaurant",
              ngo: "NGO",
              admin: "Administrator"
            };
            const actualName = names[l] || l;
            const attemptedName = names[targetRole] || targetRole;
            o("Access Denied: This account is registered as a " + actualName + ". You can only log in through the " + actualName + " portal, not as a " + attemptedName + ".", "error");
          } else {
            o("Welcome back to FoodBridge (" + targetRole.toUpperCase() + ")!", "success");
            const q = l ? w[l] : C;
            S(q, { replace: !0 });
          }
        } catch (a) {
          console.error("[login] handleSubmit threw:", a);
          const l =
            a instanceof Error
              ? a.message
              : "An unexpected error occurred. Please try again.";
          o(l, "error");
        } finally {
          y(!1);
        }
      }
    };
  return e.jsxs("div", {
    className:
      "pt-20 min-h-screen flex items-center justify-center px-4 py-10 gradient-bg-soft relative overflow-hidden",
    children: [
      e.jsx(J, { crumbs: [{ label: "Login", icon: N }] }),
      e.jsxs("div", {
        className: "absolute inset-0 pointer-events-none",
        children: [
          e.jsx("div", {
            className:
              "absolute top-10 left-10 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl animate-blob",
          }),
          e.jsx("div", {
            className:
              "absolute bottom-10 right-10 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl animate-blob",
            style: { animationDelay: "2s" },
          }),
        ],
      }),
      e.jsxs(r.div, {
        initial: { opacity: 0, y: 30, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.5 },
        className: "glass-card w-full max-w-md p-8 relative",
        children: [
          e.jsxs("div", {
            className: "text-center mb-8",
            children: [
              e.jsx(r.img, {
                src: "/logo.png",
                alt: "FoodBridge",
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: { type: "spring", delay: 0.2 },
                className: "h-16 w-16 mx-auto object-contain mb-3",
              }),
              e.jsx("h1", {
                className: "font-display text-2xl font-bold",
                children: targetRole === "admin"
                  ? "Admin Login"
                  : (targetRole.charAt(0).toUpperCase() + targetRole.slice(1) + " Login"),
              }),
              e.jsx("p", {
                className: "text-sm text-ink-soft dark:text-cream/60 mt-1",
                children: targetRole === "admin"
                  ? "Secure access for platform administrators"
                  : ("Sign in to access the " + targetRole + " dashboard and portal"),
              }),
            ],
          }),
          e.jsx(r.div, {
            variants: c,
            className: "mb-5",
            children: e.jsxs("div", {
              className: "space-y-2",
              children: [
                e.jsx("div", {
                  className: "flex items-center justify-between text-xs px-1 font-semibold text-ink-soft/70 dark:text-cream/60",
                  children: [
                    e.jsx("span", { children: "Select Login Portal:" }),
                    e.jsxs("span", {
                      className: "text-[11px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wide",
                      children: ["Portal: ", targetRole]
                    })
                  ]
                }),
                e.jsx("div", {
                  className: "grid grid-cols-5 gap-1 p-1 rounded-2xl bg-linen/60 dark:bg-secondary-800/80 border border-linen dark:border-secondary-700",
                  children: [
                    { id: "donor", label: "Donor", icon: "🍱" },
                    { id: "volunteer", label: "Volunteer", icon: "🤝" },
                    { id: "restaurant", label: "Restaurant", icon: "🍽️" },
                    { id: "ngo", label: "NGO", icon: "🏢" },
                    { id: "admin", label: "Admin", icon: "🛡️" },
                  ].map((rt) =>
                    e.jsxs("button", {
                      key: rt.id,
                      type: "button",
                      onClick: () => {
                        setTargetRole(rt.id);
                        b("");
                        j("");
                        d({});
                      },
                      className: `flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                        targetRole === rt.id
                          ? "bg-primary-600 text-white shadow-md shadow-primary-600/30 font-semibold"
                          : "text-ink-soft dark:text-cream/70 hover:bg-linen/80 dark:hover:bg-secondary-700"
                      }`,
                      children: [
                        e.jsx("span", { className: "text-sm mb-0.5", children: rt.icon }),
                        e.jsx("span", { className: "text-[10px] sm:text-[11px] truncate", children: rt.label })
                      ]
                    })
                  )
                }),
                e.jsxs("div", {
                  className: "p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 text-center font-medium",
                  children: [
                    e.jsx("span", { children: "🔒" }),
                    e.jsx("span", {
                      children: targetRole === "admin"
                        ? "Admin portal: Username: Foodbridge | Password: Food@12"
                        : ("Strict Role Guard: Only registered " + targetRole.toUpperCase() + " accounts can log in here.")
                    })
                  ]
                })
              ]
            }),
          }),
          e.jsxs(r.form, {
            variants: z,
            initial: "hidden",
            animate: "visible",
            onSubmit: $,
            className: "space-y-5",
            children: [
              e.jsxs(r.div, {
                variants: c,
                children: [
                  e.jsx("label", {
                    className: "input-label",
                    children: t ? "Admin Username" : "Email or Username",
                  }),
                  e.jsxs("div", {
                    className: "relative",
                    children: [
                      t
                        ? e.jsx(f, {
                            className:
                              "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-500",
                          })
                        : e.jsx(K, {
                            className:
                              "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft/60 dark:text-cream/40",
                          }),
                      e.jsx("input", {
                        value: m,
                        onChange: (s) => {
                          (b(s.target.value),
                            d((a) => ({ ...a, identifier: void 0 })));
                        },
                        className: `input-field pl-12 ${n.identifier ? "border-red-400 focus:ring-red-400" : ""} ${t ? "border-primary-300 focus:ring-primary-500" : ""}`,
                        placeholder: targetRole === "admin"
                          ? "Foodbridge"
                          : ("Enter your " + targetRole + " email or username"),
                        autoCapitalize: "none",
                        autoCorrect: "off",
                      }),
                    ],
                  }),
                  n.identifier &&
                    e.jsx("p", {
                      className: "text-xs text-red-500 mt-1",
                      children: n.identifier,
                    }),
                ],
              }),
              e.jsxs(r.div, {
                variants: c,
                children: [
                  e.jsx("label", {
                    className: "input-label",
                    children: "Password",
                  }),
                  e.jsxs("div", {
                    className: "relative",
                    children: [
                      e.jsx(_, {
                        className:
                          "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-soft/60 dark:text-cream/40",
                      }),
                      e.jsx("input", {
                        type: x ? "text" : "password",
                        value: u,
                        onChange: (s) => {
                          (j(s.target.value),
                            d((a) => ({ ...a, password: void 0 })));
                        },
                        className: `input-field pl-12 pr-12 ${n.password ? "border-red-400 focus:ring-red-400" : ""}`,
                        placeholder: "******",
                      }),
                      e.jsx("button", {
                        type: "button",
                        onClick: () => E(!x),
                        className:
                          "absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft/60 dark:text-cream/40 hover:text-ink-soft dark:text-cream/70",
                        children: x
                          ? e.jsx(Q, { className: "h-5 w-5" })
                          : e.jsx(V, { className: "h-5 w-5" }),
                      }),
                    ],
                  }),
                  n.password &&
                    e.jsx("p", {
                      className: "text-xs text-red-500 mt-1",
                      children: n.password,
                    }),
                ],
              }),
              !t &&
                e.jsxs(r.div, {
                  variants: c,
                  className:
                    "flex flex-wrap items-center justify-between gap-2 text-sm",
                  children: [
                    e.jsxs("label", {
                      className: "flex items-center gap-2 cursor-pointer",
                      children: [
                        e.jsx("input", {
                          type: "checkbox",
                          checked: F,
                          onChange: (s) => R(s.target.checked),
                          className:
                            "h-4 w-4 rounded text-primary-600 focus:ring-primary-500",
                        }),
                        e.jsx("span", {
                          className: "text-ink-soft dark:text-cream/60",
                          children: "Remember me",
                        }),
                      ],
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () =>
                        o(
                          "Please use the password reset link sent to your email, or contact support@foodbridge.org.",
                          "info",
                        ),
                      className: "text-primary-600 hover:underline",
                      children: "Forgot password?",
                    }),
                  ],
                }),
              e.jsx(r.div, {
                variants: c,
                children: e.jsx(G, {
                  type: "submit",
                  variant: "primary",
                  fullWidth: !0,
                  disabled: p,
                  children: p
                    ? e.jsx("span", {
                        className:
                          "h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin",
                      })
                    : e.jsx(e.Fragment, {
                        children: targetRole === "admin"
                          ? e.jsxs(e.Fragment, {
                              children: [
                                "Sign in as Administrator ",
                                e.jsx(f, { className: "h-4 w-4" }),
                              ],
                            })
                          : e.jsxs(e.Fragment, {
                              children: [
                                ("Sign in as " + targetRole.charAt(0).toUpperCase() + targetRole.slice(1) + " "),
                                e.jsx(N, { className: "h-4 w-4" }),
                              ],
                            }),
                      }),
                }),
              }),
              !t &&
                e.jsxs(r.p, {
                  variants: c,
                  className:
                    "text-center text-sm text-ink-soft dark:text-cream/60",
                  children: [
                    "New to FoodBridge? ",
                    e.jsxs(U, {
                      to: "/register",
                      className:
                        "text-primary-600 font-semibold hover:underline flex items-center justify-center gap-1",
                      children: [
                        "Register here ",
                        e.jsx(H, { className: "h-3 w-3" }),
                      ],
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
    ],
  });
}
export { le as LoginPage };
