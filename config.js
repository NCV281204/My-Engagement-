// Shared by index.html and guests.html (the ticket page). Edit the block below.
// ===== Edit this block =====
const CONFIG = {
  groom: "នៅ ចំណានវិជ្ជា",
  bride: "ទេស និស្ស័យ",
  guest: "លោក សុខ រតនៈទិសាល និងភរិយា",   // or share links like index.html?guest=ឈ្មោះភ្ញៀវ
  date: "2026-10-16",                      // YYYY-MM-DD
  time: "11:00",                           // 24-hour, Cambodia time (UTC+7)
  hours: 4,                                // length of the event
  venue: "",      // optional line of text under the map, for example the hall name
  address: "",    // optional second line under the map
  // Paste your Google Maps link here. The map on the page and the button both follow it.
  // Use the long link from your browser's address bar (https://www.google.com/maps/place/...).
  mapLink: "https://www.google.com/maps?q=11.1468420,105.6805939&entry=gps&shh=CAE&lucs=,94297699,94231188,94280568,100821559,47071704,94218641,94282134,100835699,94286869,100820247,100822504,100838877,121816461&g_ep=CAISEjI2LjQwLjMuOTg5Mjk1MzUwMBgAINeCAyp7LDk0Mjk3Njk5LDk0MjMxMTg4LDk0MjgwNTY4LDEwMDgyMTU1OSw0NzA3MTcwNCw5NDIxODY0MSw5NDI4MjEzNCwxMDA4MzU2OTksOTQyODY4NjksMTAwODIwMjQ3LDEwMDgyMjUwNCwxMDA4Mzg4NzcsMTIxODE2NDYxQgJLSA%3D%3D&skid=fa148fc2-d893-4bc4-a696-4646cef6ca63&g_st=it"
};
// ===========================

const kh = (s) => String(s).replace(/\d/g, (d) => "០១២៣៤៥៦៧៨៩"[d]);
const DAYS = ["អាទិត្យ","ច័ន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const MONTHS = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];

// Date and time in Khmer and English, built from CONFIG.date and CONFIG.time
const [dateKh, timeKh, dateEn, timeEn] = (() => {
  const [y, m, d] = CONFIG.date.split("-").map(Number);
  const [hh, mm] = CONFIG.time.split(":").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  const period = hh < 12 ? "ព្រឹក" : hh < 18 ? "រសៀល" : "ល្ងាច";
  const h12 = hh % 12 === 0 ? 12 : hh % 12, pad = (n) => String(n).padStart(2, "0");
  return [
    `ថ្ងៃ${DAYS[day.getUTCDay()]} ទី${kh(d)} ខែ${MONTHS[m - 1]} ឆ្នាំ${kh(y)}`,
    `វេលាម៉ោង ${kh(pad(h12))}:${kh(pad(mm))} ${period}`,
    day.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
    `at ${pad(h12)}:${pad(mm)} ${hh < 12 ? "AM" : "PM"}`
  ];
})();
const dateText = `${dateKh} ${timeKh}`;
