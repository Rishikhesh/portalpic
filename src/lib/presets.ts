// Upload specs, checked against official notifications on 2026-11-17.
// exact: the portal states these pixels. Otherwise w/h is a size we picked that satisfies the stated rules.
// To add or fix a preset, edit this list and cite the official PDF in `source`.
const NTA_PHOTO = "Face ~80% with ears visible, white background. A live photo is also taken and matched.";

import type { Spec } from "./spec";

export const PRESETS: Spec[] = [
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

  { id: "upsc-photo", group: "UPSC", label: "Photo", w: 350, h: 450, minKB: 20, maxKB: 200, faceHeight: 0.78,
    note: "Face ≥ 75% of the photo, both ears visible, white background. A live photo is also taken and matched.", source: "https://upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf", official: true },
  { id: "upsc-signature", group: "UPSC", label: "Signature (3 times)", w: 350, h: 500, minKB: 20, maxKB: 100,
    note: "Sign three times, one below the other, black ink on white paper, as one image (350–500 px).", source: "https://upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf", official: true },

  { id: "rrb-signature", group: "RRB (Railways)", label: "Signature", w: 280, h: 120, minKB: 30, maxKB: 49, dpi: 200,
    note: "At least 140×60 px, 100+ DPI, cursive in black ink. RRB photos are taken live, so there's no photo upload.", source: "https://www.rrbapply.gov.in/assets/forms/CEN_06_2026_NTPC_G.pdf", official: true },

  { id: "neet-photo", group: "NEET UG", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO, faceHeight: 0.8,
    source: "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf", official: true },
  { id: "neet-signature", group: "NEET UG", label: "Signature", w: 350, h: 150, minKB: 10, maxKB: 100, note: "No pixel size given.",
    source: "https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf", official: true },
  { id: "jee-photo", group: "JEE Main", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO, faceHeight: 0.8,
    source: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf", official: true },
  { id: "jee-signature", group: "JEE Main", label: "Signature", w: 350, h: 150, minKB: 10, maxKB: 100, note: "No pixel size given.",
    source: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf", official: true },
  { id: "cuet-photo", group: "CUET UG", label: "Photo", w: 350, h: 450, minKB: 10, maxKB: 200, note: NTA_PHOTO, faceHeight: 0.8,
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

  // Visa, passport and ID portals, checked against official pages on 2026-11-18. w/h is the stated minimum (or preferred) size at the stated shape unless exact.
  { id: "uk-visa-online", group: "United Kingdom", label: "Visa photo (online)", w: 600, h: 750, minKB: 50, maxKB: 6144,
    note: "At least 600 × 750 px, portrait, plain light-coloured background, not filtered or edited.", source: "https://www.gov.uk/guidance/how-to-take-a-photo-for-a-visa-application-or-permission", official: true },
  { id: "uk-passport-online", group: "United Kingdom", label: "Passport photo (online)", w: 600, h: 750, minKB: 50, maxKB: 10240,
    note: "At least 600 × 750 px, plain light-coloured background, mouth closed, eyes open, no shadows.", source: "https://www.gov.uk/photos-for-passports", official: true },

  { id: "in-evisa", group: "India Visa & OCI", label: "e-Visa photo", w: 600, h: 600, minKB: 10, maxKB: 1024,
    note: "Square (height equals width), plain light-coloured or white background.", source: "https://indianvisaonline.gov.in/evisa/tvoa.html", official: true },
  { id: "in-visa-regular", group: "India Visa & OCI", label: "Regular visa photo", w: 600, h: 600, minKB: 10, maxKB: 300,
    note: "Square, 350 × 350 to 1000 × 1000 px.", source: "https://indianvisaonline.gov.in/visa/VSS_IMAGE.pdf", official: true },
  { id: "in-oci-online", group: "India Visa & OCI", label: "OCI card photo", w: 600, h: 600, minKB: 0, maxKB: 200,
    note: "Square, 200 × 200 to 900 × 900 px, plain white background, no border.", source: "https://www.eoiasuncion.gov.in/how-to-apply-oci.php", official: true },

  { id: "ca-passport-online", group: "Canada", label: "Passport photo (online)", w: 1200, h: 1800, minKB: 200, maxKB: 5120, faceHeight: 0.475,
    note: "2:3 portrait, chin to crown 45–50% of the height, taken by a professional, not edited.", source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html", official: true },
  { id: "ca-pr-card", group: "Canada", label: "PR card photo", w: 715, h: 1000, minKB: 0, maxKB: 4096,
    note: "715 × 1000 to 2000 × 2800 px, plain untextured white background, face and shoulders centred.", source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/pr-card/apply-renew-replace/photo.html", official: true },
  { id: "ca-citizenship-online", group: "Canada", label: "Citizenship photo (online)", w: 420, h: 540, minKB: 0, maxKB: 4096,
    note: "At least 420 × 540 px, minimal compression, plain white or light-coloured background.", source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/citizenship-application-photograph-specifications/grant-online.html", official: true },

  { id: "au-citizenship-online", group: "Australia", label: "Citizenship photo (online)", w: 1200, h: 1600, minKB: 70, maxKB: 3584,
    note: "1200 × 1600 px preferred, neutral or light grey background, unedited, not a scan of a print.", source: "https://immi.homeaffairs.gov.au/citizenship/photo-requirements-for-citizenship-applications", official: true },

  { id: "cn-cova", group: "China", label: "Visa photo (COVA online form)", w: 354, h: 472, minKB: 40, maxKB: 120,
    note: "No larger than 354 × 472 px, white or near-white background, taken in the last 6 months.", source: "https://www.visaforchina.cn/MAN4_EN/qianzhengyewu/jichuzhishi/changjianwenti/552365353674608655.html", official: true },

  { id: "sg-ica-eservices", group: "Singapore", label: "ICA e-Services photo", w: 400, h: 514, exact: true, minKB: 0, maxKB: 8192,
    note: "Exactly 400 × 514 px, plain white background, recent colour photo.", source: "https://www.ica.gov.sg/photo-guidelines", official: true },

  { id: "ie-passport-online", group: "Ireland", label: "Passport photo (online)", w: 715, h: 951, minKB: 0, maxKB: 9216,
    note: "At least 715 × 951 px, not enhanced, plain light grey, white or cream background.", source: "https://www.ireland.ie/en/dfa/passports/photo-guidelines/", official: true },

  { id: "nz-passport-online", group: "New Zealand", label: "Passport photo (online)", w: 900, h: 1200, minKB: 250, maxKB: 5120,
    note: "3:4, 900–4500 px wide, less than 6 months old.", source: "https://www.passports.govt.nz/passport-photos/check-your-photo-meets-the-technical-requirements", official: true },
];
