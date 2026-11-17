// Upload specs, checked against official notifications on 2026-11-17.
// exact: the portal states these pixels. Otherwise w/h is a size we picked that satisfies the stated rules.
// To add or fix a preset, edit this list and cite the official PDF in `source`.
const NTA_PHOTO = "Face ~80% with ears visible, white background. A live photo is also taken and matched.";

export const PRESETS = [
  { id: "ibps-photo", group: "IBPS", label: "Photo", w: 200, h: 230, exact: true, minKB: 20, maxKB: 50,
    note: "Passport-style colour photo, light background. A live photo is also taken.", source: "https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XV.pdf", official: true },
  { id: "ibps-signature", group: "IBPS", label: "Signature", w: 140, h: 60, exact: true, minKB: 10, maxKB: 20,
    note: "Black ink on white paper, not in capital letters.", source: "https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XV.pdf", official: true },
  { id: "ibps-thumb", group: "IBPS", label: "Left thumb impression", w: 240, h: 240, exact: true, minKB: 20, maxKB: 50, dpi: 200,
    note: "Black or blue ink on white paper.", source: "https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XV.pdf", official: true },
  { id: "ibps-declaration", group: "IBPS", label: "Handwritten declaration", w: 800, h: 400, exact: true, minKB: 50, maxKB: 100, dpi: 200,
    note: "Handwritten in English, black ink, not in capital letters.", source: "https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XV.pdf", official: true },

  { id: "ssc-signature", group: "SSC", label: "Signature", w: 360, h: 120, minKB: 10, maxKB: 20,
    note: "No pixel size given (about 6 × 2 cm). SSC photos are taken live by webcam, so there's no photo upload.", source: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf", official: true },

  { id: "upsc-photo", group: "UPSC", label: "Photo", w: 350, h: 450, minKB: 20, maxKB: 200,
    note: "Face ≥ 75% of the photo, both ears visible, white background. A live photo is also taken and matched.", source: "https://upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf", official: true },
  { id: "upsc-signature", group: "UPSC", label: "Signature (3 times)", w: 350, h: 500, minKB: 20, maxKB: 100,
    note: "Sign three times, one below the other, black ink on white paper, as one image (350–500 px).", source: "https://upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf", official: true },

  { id: "rrb-signature", group: "RRB (Railways)", label: "Signature", w: 280, h: 120, minKB: 30, maxKB: 49, dpi: 200,
    note: "At least 140×60 px, 100+ DPI, cursive in black ink. RRB photos are taken live, so there's no photo upload.", source: "https://www.rrbapply.gov.in/assets/forms/CEN_06_2026_NTPC_G.pdf", official: true },

  { id: "neet-photo", group: "NEET UG", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO,
    source: "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf", official: true },
  { id: "neet-signature", group: "NEET UG", label: "Signature", w: 350, h: 150, minKB: 10, maxKB: 100, note: "No pixel size given.",
    source: "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf", official: true },
  { id: "jee-photo", group: "JEE Main", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO,
    source: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf", official: true },
  { id: "jee-signature", group: "JEE Main", label: "Signature", w: 350, h: 150, minKB: 10, maxKB: 100, note: "No pixel size given.",
    source: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf", official: true },
  { id: "cuet-photo", group: "CUET UG", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO,
    source: "https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/01/202601031633478370.pdf", official: true },
  { id: "cuet-signature", group: "CUET UG", label: "Signature", w: 350, h: 150, minKB: 10, maxKB: 50, note: "Max 50 KB, lower than NEET/JEE.",
    source: "https://cdnbbsr.s3waas.gov.in/s3d1a21da7bca4abff8b0b61b87597de73/uploads/2026/01/202601031633478370.pdf", official: true },

  { id: "gate-photo", group: "GATE", label: "Photo", w: 480, h: 640, minKB: 5, maxKB: 600,
    note: "Allowed 200×260 to 530×690 px, width/height 0.66–0.89. Face 60–70% of the image, white background.", source: "https://gate2026.iitg.ac.in/photograph-and-signature.html", official: true },
  { id: "gate-signature", group: "GATE", label: "Signature", w: 480, h: 150, minKB: 3, maxKB: 300,
    note: "Allowed 250×80 to 580×180 px, width/height 2.75–3.75. Signature fills 70–80%, dark ink.", source: "https://gate2026.iitg.ac.in/photograph-and-signature.html", official: true },

  { id: "pan-nsdl-photo", group: "PAN (Protean/NSDL)", label: "Photo", w: 197, h: 276, minKB: 0, maxKB: 20, dpi: 200,
    note: "3.5 × 2.5 cm at 200 DPI, colour. From an archived official page (Jan 2025).", source: "https://tin.tin.nsdl.com/pan/InstructionDSC.html", official: true },
  { id: "pan-nsdl-signature", group: "PAN (Protean/NSDL)", label: "Signature", w: 354, h: 157, minKB: 0, maxKB: 10, dpi: 200,
    note: "2 × 4.5 cm at 200 DPI. From an archived official page (Jan 2025).", source: "https://tin.tin.nsdl.com/pan/InstructionDSC.html", official: true },
  { id: "pan-uti-photo", group: "PAN (UTIITSL)", label: "Photo", w: 213, h: 213, exact: true, minKB: 0, maxKB: 30, dpi: 300,
    note: "Unconfirmed: no official spec found. 213×213 px is what other tools use; some say 50 KB.", source: "https://www.pan.utiitsl.com/", official: false },

  // 600×600×3 bytes at the 20:1 compression limit means at least ~54 KB.
  { id: "us-ds160", group: "US Visa", label: "DS-160 photo", w: 600, h: 600, minKB: 53, maxKB: 240,
    note: "Square, 600–1200 px, sRGB colour, compression no more than 20:1 (so at least ~54 KB).", source: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/digital-image-requirements.html", official: true },
  { id: "us-passport-online", group: "US Passport", label: "Online renewal photo", w: 1200, h: 1200, minKB: 54, maxKB: 10240,
    note: "Unedited colour photo from the last 6 months, white or off-white background.", source: "https://travel.state.gov/en/passports/renew-replace/online/upload-digital-photo.html", official: true },
];
