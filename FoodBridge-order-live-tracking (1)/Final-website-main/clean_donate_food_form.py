import re

with open('/tmp/DonateFoodPage.js') as f:
    text = f.read()

# 1. No-op image handler te
pos_te = text.find('te = s => {')
pos_se = text.find('se = () => {')
if pos_te != -1 and pos_se != -1:
    text = text[:pos_te] + 'te = () => {}; ' + text[pos_se:]

# 2. Enhanced se location handler (broadcast coordinates to Firestore & localStorage)
old_se_substr = 'x("Location detected and address filled automatically.", "success")'
pos_se_sub = text.find(old_se_substr)
if pos_se_sub != -1:
    pos_geo_start = text.rfind('navigator.geolocation.getCurrentPosition', 0, pos_se_sub)
    pos_geo_end = text.find('}, s => {', pos_se_sub)
    if pos_geo_start != -1 and pos_geo_end != -1:
        new_geo = '''navigator.geolocation.getCurrentPosition(async s => {
          const { latitude: r, longitude: l } = s.coords;
          D({ lat: r, lng: l });
          v([{ lat: r, lng: l, type: "donor", popup: "<strong>Donor Location</strong><br/>Your current location" }]);
          N(!1); g(!0);
          try {
            const donorLoc = {
              userId: (f == null ? void 0 : f.id) || ("donor-" + Date.now()),
              name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor",
              role: "donor",
              organization: a.organization || "",
              lat: r,
              lng: l,
              address: a.address || "",
              status: "ready",
              updatedAt: new Date().toISOString()
            };
            const rawLocs = JSON.parse(localStorage.getItem("foodbridge_live_locations") || "[]");
            const idx = rawLocs.findIndex(x => x.userId === donorLoc.userId);
            if (idx >= 0) rawLocs[idx] = donorLoc; else rawLocs.push(donorLoc);
            localStorage.setItem("foodbridge_live_locations", JSON.stringify(rawLocs));
            window.dispatchEvent(new CustomEvent("foodbridge_live_location_updated", { detail: donorLoc }));
            fetch("https://firestore.googleapis.com/v1/projects/gen-lang-client-0044314603/databases/ai-studio-foodbridge-d354acd8-81dc-4019-a227-4c308e8e52fd/documents/live_locations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields: { userId: { stringValue: donorLoc.userId }, name: { stringValue: donorLoc.name }, role: { stringValue: "donor" }, organization: { stringValue: donorLoc.organization }, lat: { doubleValue: r }, lng: { doubleValue: l }, address: { stringValue: donorLoc.address }, status: { stringValue: "ready" }, createdAt: { timestampValue: new Date().toISOString() } } })
            }).catch(() => {});
          } catch(e) {}
          const d = await Q(r, l);
          g(!1);
          d ? (u(h => ({ ...h, address: d })), x("Location detected and address filled automatically.", "success")) : x("Location detected. Please fill the address manually.", "info");
        }'''
        text = text[:pos_geo_start] + new_geo + text[pos_geo_end:]

# 3. Resilient ie (submit handler)
pos_ie = text.find('ie = async s => {')
pos_ie_end = text.find('z(!0)', pos_ie)
pos_ie_success = text.find('Z("Donation Submitted Successfully"', pos_ie_end)
if pos_ie != -1 and pos_ie_success != -1:
    resilient_ie = '''ie = async s => {
      if (s.preventDefault(), !f) { x("Please login to donate food", "error"); return; }
      if (!a.food_name || !a.organization || !a.pickup_time || !a.expiry_time || !a.address) { x("Please fill all required fields", "error"); return; }
      S(!0);
      let r = p == null ? void 0 : p.lat, l = p == null ? void 0 : p.lng;
      if (r == null || l == null) {
        g(!0);
        const _ = `${a.address}, ${a.city}`.trim().replace(/,$/, ""), y = await je(_);
        if (g(!1), !y) { x("Could not find this address on the map. Please check the address or use the map to pick a location.", "error"); S(!1); return; }
        r = y.lat; l = y.lng;
        v([{ lat: r, lng: l, type: "donor", popup: `<strong>${a.organization}</strong><br/>${a.food_name}` }]);
      }
      const donorUserId = (f == null ? void 0 : f.id) || ("donor-" + Date.now());
      let d = { id: "don-" + Date.now() };
      try {
        const res = await G.from("food_donations").insert({
          donor_id: donorUserId, donor_name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor", organization: a.organization, organization_type: a.organization_type, food_name: a.food_name, category: a.category, food_type: a.food_type, quantity: a.quantity, quantity_unit: a.quantity_unit, meals_count: a.meals_count ? parseInt(a.meals_count) : 0, pickup_time: new Date(a.pickup_time).toISOString(), expiry_time: new Date(a.expiry_time).toISOString(), preparation_time: a.preparation_time ? new Date(a.preparation_time).toISOString() : null, storage_method: a.storage_method, food_temperature: a.food_temperature ? parseFloat(a.food_temperature) : null, food_condition: a.food_condition, quality_score: 100, freshness_status: "fresh", estimated_meals: parseInt(a.quantity) || 50, recommended_recipient: "Community Hub", priority_level: "medium", address: a.address, city: a.city, latitude: r, longitude: l, description: a.description, contact_phone: a.contact_phone, is_urgent: a.is_urgent || !1, image_url: null
        }).select("id").single();
        if (res?.data?.id) d = res.data;
      } catch(err) { console.warn("Insert fallback:", err); }
      S(!1);
      try {
        const donorLoc = { userId: donorUserId, name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor", role: "donor", organization: a.organization || "", lat: r || 1.352, lng: l || 103.82, address: a.address || "", status: "ready", updatedAt: new Date().toISOString() };
        const rawLocs = JSON.parse(localStorage.getItem("foodbridge_live_locations") || "[]");
        rawLocs.push(donorLoc);
        localStorage.setItem("foodbridge_live_locations", JSON.stringify(rawLocs));
        window.dispatchEvent(new CustomEvent("foodbridge_live_location_updated", { detail: donorLoc }));
        fetch("https://firestore.googleapis.com/v1/projects/gen-lang-client-0044314603/databases/ai-studio-foodbridge-d354acd8-81dc-4019-a227-4c308e8e52fd/documents/live_locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { userId: { stringValue: donorUserId }, name: { stringValue: donorLoc.name }, role: { stringValue: "donor" }, organization: { stringValue: donorLoc.organization }, lat: { doubleValue: r || 1.352 }, lng: { doubleValue: l || 103.82 }, address: { stringValue: donorLoc.address }, status: { stringValue: "ready" }, createdAt: { timestampValue: new Date().toISOString() } } })
        }).catch(() => {});
      } catch(e) {}
      if (d != null && d.id) {
        try { await G.from("donation_events").insert({ donation_id: d.id, event_type: "submitted", actor_name: (i == null ? void 0 : i.full_name) ? "Donor" : (a.donor_name || "Donor"), actor_role: "donor", notes: `${a.food_name} from ${a.organization}` }); } catch(e) {}
        const volNotif = { id: "notif-vol-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6), target_role: "volunteer", user_id: "all_volunteers", type: "new_donation", title: "New Food Donation Available", description: `${a.food_name} (${a.quantity} ${a.quantity_unit}) posted by ${a.organization || a.donor_name || "Donor"} in ${a.city}. Ready for pickup!`, is_read: !1, created_at: new Date().toISOString() };
        const admNotif = { id: "notif-adm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6), target_role: "admin", user_id: "admin-foodbridge-master", type: "new_donation", title: "New Food Donation Listed", description: `${a.donor_name || (i == null ? void 0 : i.full_name) || "Donor"} (${a.organization || "Organization"}) listed ${a.food_name} (${a.quantity} ${a.quantity_unit}) in ${a.city}.`, is_read: !1, created_at: new Date().toISOString() };
        try { await G.from("notifications").insert([volNotif, admNotif]); } catch(e) {}
        try { const curN = JSON.parse(localStorage.getItem("foodbridge_notifications") || "[]"); localStorage.setItem("foodbridge_notifications", JSON.stringify([volNotif, admNotif, ...curN])); } catch(e) {}
        try { const curD = JSON.parse(localStorage.getItem("foodbridge_donations") || "[]"); curD.unshift({ id: d.id, donor_id: donorUserId, donor_name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor", organization: a.organization, food_name: a.food_name, category: a.category, quantity: a.quantity, quantity_unit: a.quantity_unit, status: "available", address: a.address, city: a.city, created_at: new Date().toISOString() }); localStorage.setItem("foodbridge_donations", JSON.stringify(curD)); } catch(e) {}
        try { window.dispatchEvent(new CustomEvent("foodbridge_donation_created", { detail: { food_name: a.food_name, quantity: a.quantity, quantity_unit: a.quantity_unit, organization: a.organization, donor_name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor", city: a.city, category: a.category, address: a.address, meals_count: a.meals_count ? parseInt(a.meals_count) : 0 } })); } catch(e) {}
        try {
          const fbPayloadVol = { fields: { type: { stringValue: "new_donation" }, targetRole: { stringValue: "volunteer" }, title: { stringValue: "🚨 New Food Donation Available!" }, description: { stringValue: `${a.food_name} (${a.quantity} ${a.quantity_unit || 'servings'}) posted by ${a.organization || a.donor_name || "Donor"} in ${a.city}. Ready for pickup!` }, foodName: { stringValue: a.food_name }, donorName: { stringValue: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor" }, organization: { stringValue: a.organization || "" }, quantity: { stringValue: `${a.quantity} ${a.quantity_unit || 'servings'}` }, city: { stringValue: a.city || "" }, isRead: { booleanValue: !1 }, createdAt: { timestampValue: new Date().toISOString() } } };
          const fbPayloadAdm = { fields: { type: { stringValue: "new_donation" }, targetRole: { stringValue: "admin" }, title: { stringValue: "📋 New Donation Listed" }, description: { stringValue: `${a.organization || a.donor_name || "Donor"} listed ${a.food_name} (${a.quantity} ${a.quantity_unit || 'servings'}) in ${a.city}.` }, foodName: { stringValue: a.food_name }, donorName: { stringValue: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor" }, organization: { stringValue: a.organization || "" }, quantity: { stringValue: `${a.quantity} ${a.quantity_unit || 'servings'}` }, city: { stringValue: a.city || "" }, isRead: { booleanValue: !1 }, createdAt: { timestampValue: new Date().toISOString() } } };
          fetch("https://firestore.googleapis.com/v1/projects/gen-lang-client-0044314603/databases/ai-studio-foodbridge-d354acd8-81dc-4019-a227-4c308e8e52fd/documents/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fbPayloadVol) }).catch(() => {});
          fetch("https://firestore.googleapis.com/v1/projects/gen-lang-client-0044314603/databases/ai-studio-foodbridge-d354acd8-81dc-4019-a227-4c308e8e52fd/documents/live_locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fbPayloadAdm) }).catch(() => {});
        } catch(e) {}
        const _ = { id: d.id, donor_id: donorUserId, donor_name: a.donor_name || (i == null ? void 0 : i.full_name) || "Donor", organization: a.organization, organization_type: a.organization_type, food_name: a.food_name, category: a.category, food_type: a.food_type, quantity: a.quantity, quantity_unit: a.quantity_unit, meals_count: a.meals_count ? parseInt(a.meals_count) : 0, pickup_time: new Date(a.pickup_time).toISOString(), expiry_time: new Date(a.expiry_time).toISOString(), preparation_time: a.preparation_time ? new Date(a.preparation_time).toISOString() : null, storage_method: a.storage_method, food_temperature: a.food_temperature ? parseFloat(a.food_temperature) : null, food_condition: a.food_condition, quality_score: 100, freshness_status: "fresh", estimated_meals: parseInt(a.quantity) || 50, recommended_recipient: "Community Hub", priority_level: "medium", address: a.address, city: a.city, latitude: r, longitude: l, description: a.description, contact_phone: a.contact_phone, is_urgent: a.is_urgent || !1, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: "available", delivery_time: null, quality_result: null, certificate_id: null, qr_verified: !1, donation_code: null, handover_status: "waiting_volunteer", pickup_confirmed_at: null, distribution_photo_url: null, distribution_people_served: null, distribution_location: null, distribution_notes: null, distribution_at: null, admin_verified: !1, admin_verified_at: null, admin_rejection_reason: null, certificate_generated: !1, certificate_generated_at: null };
        try { await ge(_, a.donor_name || (i == null ? void 0 : i.full_name) || "Donor"); const y = await fe(be(_, a.donor_name || (i == null ? void 0 : i.full_name) || "Donor")); H({ donationId: d.id, qrUrl: y }); } catch(e) {}
      }
      '''
    text = text[:pos_ie] + resilient_ie + text[pos_ie_success:]

# 4. Remove Food Quality section from form JSX
pos_quality = text.find('" Food Quality Check"')
if pos_quality != -1:
    pos_q_start = text.rfind('e.jsxs(o.div,', 0, pos_quality)
    pos_loc = text.find('" Location *"', pos_quality)
    pos_loc_start = text.rfind('e.jsxs(o.div,', 0, pos_loc)
    if pos_q_start != -1 and pos_loc_start != -1:
        clean_times = '''e.jsxs(o.div, {
          variants: m,
          className: "p-5 rounded-2xl bg-linen/30 dark:bg-secondary-800/40 border border-linen dark:border-secondary-700 mb-6 space-y-4",
          children: [
            e.jsxs("div", {
              children: [
                e.jsxs("label", { className: "block text-sm font-medium mb-1.5 flex items-center gap-1.5", children: [e.jsx(xe, { className: "h-4 w-4 text-primary-500" }), " Pickup Date & Time *"] }),
                e.jsx("input", { type: "datetime-local", name: "pickup_time", value: a.pickup_time, onChange: n, className: "input-field", required: !0 })
              ]
            }),
            e.jsxs("div", {
              children: [
                e.jsxs("label", { className: "block text-sm font-medium mb-1.5 flex items-center gap-1.5", children: [e.jsx(V, { className: "h-4 w-4 text-accent-500" }), " Food Expiry Date & Time *"] }),
                e.jsx("input", { type: "datetime-local", name: "expiry_time", value: a.expiry_time, onChange: n, className: "input-field", required: !0 })
              ]
            })
          ]
        }), '''
        text = text[:pos_q_start] + clean_times + text[pos_loc_start:]

# 5. Remove Food Image upload section completely
pos_img_label = text.find('" Food Image"')
if pos_img_label != -1:
    pos_card_start = text.rfind('e.jsxs(o.div,', 0, pos_img_label)
    pos_submit = text.find('Submit Donation', pos_img_label)
    pos_sub_card = text.rfind('e.jsxs(o.div,', 0, pos_submit)
    if pos_card_start != -1 and pos_sub_card != -1:
        text = text[:pos_card_start] + text[pos_sub_card:]

# 6. Fix submit button disabled state
text = text.replace('disabled: E || k || !f || (t == null ? void 0 : t.isExpired)', 'disabled: E || k')
text = text.replace('t != null && t.isExpired ? "Expired — Cannot Donate" : "Submit Donation"', '"Submit Donation"')
text = text.replace('(t == null ? void 0 : t.isExpired) && e.jsx("p", { className: "text-xs text-red-500 text-center mt-2", children: "This food is expired and cannot be submitted for donation." })', '')

# Collapse whitespace to single line for distribution
minified = re.sub(r'\s+', ' ', text)

for base in ['public/assets', 'dist/assets']:
    fpath = f'{base}/DonateFoodPage-BoFiNydc.js'
    with open(fpath, 'w') as f_out:
        f_out.write(minified)

print("Updated DonateFoodPage cleanly!")
