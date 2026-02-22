const IIITH_LOGO = "https://www.iiit.ac.in/wp-content/uploads/2022/06/IIIT_Hyderabad_Logo-e1655116937986.jpg";

const companies = [
  { name: "ACCENTURE", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/163px-Accenture.svg.png", url: "https://www.accenture.com" },
  { name: "ACMEGRADE", logo: "https://acmegrade.com/images/logo.svg", url: "https://www.acmegrade.com" },
  { name: "ADCURATIO", logo: "https://media.licdn.com/dms/image/C560BAQHEeTqNjV7uFg/company-logo_200_200/0?e=2159024400&t=fHjaNXpNchmzBL9Dv68Uu0RUBtfFmZJWi4HJsAXgm00&v=beta", url: "https://www.adcuratio.com" },
  { name: "ALPHANOME STUDIOS", logo: "https://avatars.githubusercontent.com/u/127743907?s=200&v=4", url: "https://alphanome.ai" },
  { name: "AMAZON", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", url: "https://www.amazon.com" },
  { name: "AMZUR", logo: "https://www.google.com/s2/favicons?domain=amzur.com&sz=128", url: "https://www.amzur.com" },
  { name: "ASHOK LEYLAND", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ashok_Leyland_logo.svg/512px-Ashok_Leyland_logo.svg.png", url: "https://www.ashokleyland.com" },
  { name: "AURUS", logo: "https://www.aurusinc.com/assets/images/aurus-logo.png", url: "https://www.aurusinc.com" },
  { name: "BENED SOFTWARE", logo: "https://www.google.com/s2/favicons?domain=benedsoft.com&sz=128", url: "https://www.benedsoft.com" },
  { name: "CODETHANTHRA", logo: "https://www.codetantra.com/img/logo-black-text.png", url: "https://www.codetantra.com" },
  { name: "COGENT", logo: "https://cdn.prod.website-files.com/641822035aac658e9fa7f1c8/653a326fcf10b8a475911356_cogent_logo_full_colour.svg", url: "https://www.cogentinfo.com" },
  { name: "COGNIZANT", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Cognizant_logo_2022.svg/512px-Cognizant_logo_2022.svg.png", url: "https://www.cognizant.com" },
  { name: "COGSCI", logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/IIT_Kanpur_Logo.svg", url: "https://cogs.iitk.ac.in" },
  { name: "CRED", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/CRED-LOGO2.png", url: "https://cred.club" },
  { name: "CUMMINS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Cummins_logo.svg/960px-Cummins_logo.svg.png", url: "https://www.cummins.com" },
  { name: "CYIENT", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Cyient_Logo.svg/512px-Cyient_Logo.svg.png", url: "https://www.cyient.com" },
  { name: "DATA I2I", logo: "https://www.datai2i.com/datai2i.png", url: "https://www.datai2i.com" },
  { name: "DEVTOWN", logo: "https://www.google.com/s2/favicons?domain=devtown.in&sz=128", url: "https://www.devtown.in" },
  { name: "EIZEN AI", logo: "https://eizen.ai/img/logo.svg", url: "https://eizen.ai" },
  { name: "GOLA CYBER.AI", logo: null, url: "https://golacyber.ai" },
  { name: "HEALTHCATALYST", logo: "https://companieslogo.com/img/orig/HCAT_BIG-99c11c37.png?t=1720244492", url: "https://www.healthcatalyst.com" },
  { name: "IIIT", logo: IIITH_LOGO, url: "https://www.iiit.ac.in" },
  { name: "INMOVIDU TECH", logo: "https://gpt.movidu.in/frontend/images/movidu-logo.png", url: "http://www.inmovidutech.com" },
  { name: "INRY", logo: "https://www.inry.com/hs-fs/hubfs/%26%20(1)-png-3.png?width=882&height=96", url: "https://www.inry.com" },
  { name: "INFOSYS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/400px-Infosys_logo.svg.png", url: "https://www.infosys.com" },
  { name: "INTERN AT ISRO", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Indian_Space_Research_Organisation_Logo.svg/330px-Indian_Space_Research_Organisation_Logo.svg.png", url: "https://www.isro.gov.in" },
  { name: "LANGUAGE TRANSLATION RESEARCH CENTRE - IIIT H", logo: IIITH_LOGO, url: "https://ltrc.iiit.ac.in" },
  { name: "MIRACLE SOFTWARE SYSTEMS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Miracle-Software-Systems%2CInc-Logo.png/440px-Miracle-Software-Systems%2CInc-Logo.png", url: "https://www.yourmiracle.com" },
  { name: "MOJALOOP", logo: "https://mojaloop.io/wp-content/uploads/2020/07/mojaloop-foundation-orange.svg", url: "https://mojaloop.io" },
  { name: "MPHASIS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Mphasis_logo.svg/512px-Mphasis_logo.svg.png", url: "https://www.mphasis.com" },
  { name: "OHC PUPILFIRST", logo: "https://www.google.com/s2/favicons?domain=pupilfirst.org&sz=128", url: "https://www.pupilfirst.org" },
  { name: "PEOPLE TECH", logo: "https://www.google.com/s2/favicons?domain=peopletech.com&sz=128", url: "https://www.peopletech.com" },
  { name: "PIRAMAL SWASTHYA", logo: "https://www.piramalswasthya.org/wp-content/uploads/2017/09/logo.png", url: "https://www.piramalswasthya.org" },
  { name: "PLANET READ", logo: "https://www.planetread.org/images/logo.png", url: "https://www.planetread.org" },
  { name: "PLANET SPARK", logo: "https://cdn.planetspark.in/assets/planetspark-logo-e99f454844f44a8a32b048ee27c8c02e2e3c8999a970497ac9b8cbce1ac603e8.png", url: "https://www.planetspark.in" },
  { name: "PRODUCT LABS - IIIT H", logo: IIITH_LOGO, url: "https://www.iiit.ac.in" },
  { name: "QSPIDERS", logo: "https://qspiders.com/_nuxt/adminqspiders.CaRbyeaD.svg", url: "https://www.qspiders.com" },
  { name: "QUESTASYS TECH", logo: "https://www.questasoft.com/wp-content/uploads/2022/03/Questa-NewLogo-2019.png", url: "https://www.questasoft.com" },
  { name: "ROBOXA", logo: "https://www.roboxatech.com/img/Roboxa-SM-black.png", url: "https://www.roboxatech.com" },
  { name: "SAVANTIS HCL", logo: "https://image-service.leadiq.com/companylogo?linkedinId=27164260", url: "https://www.savantis.com" },
  { name: "SCRC", logo: IIITH_LOGO, url: "https://www.iiit.ac.in" },
  { name: "SID FARMS", logo: "https://sidsfarm.com/cdn/shop/files/427a8300092c8131bb54e0cb2557ffc9495733c9.png?v=1748503660", url: "https://www.sidfarms.com" },
  { name: "SMART CITY RESEARCH CENTRE - IIIT H", logo: IIITH_LOGO, url: "https://www.iiit.ac.in" },
  { name: "SUNGLARE TECHNOLOGIES", logo: "https://sunglaretechnologies.com/assets/uploads/media-uploader/big1654532280.jpg", url: "https://www.sunglaretechnologies.com" },
  { name: "SUTHERLAND", logo: "https://www.sutherlandglobal.com/wp-content/uploads/sites/2/2023/08/sutherland-logo-colour.png", url: "https://www.sutherlandglobal.com" },
  { name: "TCS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/TATA_Consultancy_Services_Logo.svg/800px-TATA_Consultancy_Services_Logo.svg.png", url: "https://www.tcs.com" },
  { name: "TECH MAHINDRA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Tech_Mahindra_New_Logo.svg/618px-Tech_Mahindra_New_Logo.svg.png", url: "https://www.techmahindra.com" },
  { name: "TUNERLABS", logo: "https://www.tunerlabs.com/_next/static/media/TunerlabsLogo.16837753.png", url: "https://www.tunerlabs.com" },
  { name: "VISHWAM AI - IIIT H", logo: IIITH_LOGO, url: "https://www.iiit.ac.in" },
  { name: "WTX PVT LTD", logo: "https://www.wtxindia.com/images/logo.webp", url: "https://www.wtxindia.com" },
  { name: "ZEN TECHNOLOGIES", logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/Zen_logo_2024.svg", url: "https://www.zentechnologies.com" },
];

const Placements = () => {
  // Split companies into 3 rows
  const chunkSize = Math.max(Math.ceil(companies.length / 3), 1);
  const row1 = companies.slice(0, chunkSize);
  const row2 = companies.slice(chunkSize, chunkSize * 2);
  const row3 = companies.slice(chunkSize * 2);

  const scrollLeft = `
    @keyframes scrollLeft {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `;
  const scrollRight = `
    @keyframes scrollRight {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
  `;
  const responsiveStyles = `
    .logo-row { margin: 6px 0; }
    .logo-item { min-width: 90px; height: 46px; margin: 0 6px; }
    .logo-item img { max-width: 72px; max-height: 32px; }
    .logo-item .logo-fallback { max-width: 72px; font-size: 0.55rem; }
    .logo-scroll { animation-duration: 25s !important; }
    @media (min-width: 640px) {
      .logo-row { margin: 12px 0; }
      .logo-item { min-width: 120px; height: 60px; margin: 0 10px; }
      .logo-item img { max-width: 100px; max-height: 44px; }
      .logo-item .logo-fallback { max-width: 100px; font-size: 0.6rem; }
      .logo-scroll { animation-duration: 30s !important; }
    }
    @media (min-width: 1024px) {
      .logo-row { margin: 16px 0; }
      .logo-item { min-width: 140px; height: 70px; margin: 0 15px; }
      .logo-item img { max-width: 120px; max-height: 54px; }
      .logo-item .logo-fallback { max-width: 120px; font-size: 0.65rem; }
      .logo-scroll { animation-duration: 35s !important; }
    }
  `;

  const renderRow = (row, direction) => {
    if (!row || row.length === 0) return null;
    return (
      <div className="logo-row" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
        <div
          className="logo-scroll"
          style={{
            display: "flex",
            alignItems: "center",
            width: "max-content",
            animation: `${direction} 35s linear infinite`,
          }}
        >
          {[...row, ...row].map((c, i) => (
            <a
              key={`${c.name}-${i}`}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              title={c.name}
              className="logo-item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.3s ease",
                textDecoration: "none",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {c.logo ? (
                <>
                  <img
                    src={c.logo}
                    alt={c.name}
                    style={{
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <span
                    className="logo-fallback"
                    style={{
                      display: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4338ca",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      textAlign: "center",
                      lineHeight: "1.3",
                      whiteSpace: "normal",
                    }}
                  >
                    {c.name}
                  </span>
                </>
              ) : (
                <span
                  className="logo-fallback"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4338ca",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    lineHeight: "1.3",
                    whiteSpace: "normal",
                  }}
                >
                  {c.name}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      id="placements"
      className="w-full py-12 md:py-16 lg:py-20"
      style={{ textAlign: "center", background: "#fff" }}
    >
      <style>{scrollLeft}</style>
      <style>{scrollRight}</style>
      <style>{responsiveStyles}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
          Our Placements
        </h2>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          We are proud to have collaborated with top companies globally.
        </p>
      </div>

      {renderRow(row1, "scrollLeft")}
      {renderRow(row2, "scrollRight")}
      {renderRow(row3, "scrollLeft")}
    </div>
  );
};

export default Placements;
