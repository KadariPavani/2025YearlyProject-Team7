const companies = [
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/400px-Infosys_logo.svg.png?20100302211036", url: "https://www.infosys.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/TATA_Consultancy_Services_Logo.svg/800px-TATA_Consultancy_Services_Logo.svg.png?20150525153431", url: "https://www.tcs.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", url: "https://www.google.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", url: "https://www.apple.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", url: "https://www.ibm.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", url: "https://www.amazon.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Intel_logo_2023.svg/512px-Intel_logo_2023.svg.png?20230330174340", url: "https://www.intel.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Cisco_logo.svg", url: "https://www.cisco.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg", url: "https://www.sap.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", url: "https://www.microsoft.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/512px-Salesforce.com_logo.svg.png?20210504050649", url: "https://www.salesforce.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg", url: "https://www.dell.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/HP_logo_2008.svg/960px-HP_logo_2008.svg.png?20220530172232", url: "https://www.hp.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Logo_Lenovo_%282003%29.png/640px-Logo_Lenovo_%282003%29.png", url: "https://www.lenovo.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Samsung_old_logo_before_year_2015.svg/960px-Samsung_old_logo_before_year_2015.svg.png?20221128191222", url: "https://www.samsung.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Logo-nvidia-transparent-PNG.png/640px-Logo-nvidia-transparent-PNG.png", url: "https://www.nvidia.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/AMD_Logo.svg/800px-AMD_Logo.svg.png?20220519064011", url: "https://www.amd.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/163px-Accenture.svg.png?20241209170218", url: "https://www.accenture.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Cognizant_logo_2022.svg/512px-Cognizant_logo_2022.svg.png?20220319083105", url: "https://www.cognizant.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/512px-Oracle_logo.svg.png?20210811183004", url: "https://www.oracle.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Tech_Mahindra_New_Logo.svg/618px-Tech_Mahindra_New_Logo.svg.png?20130808140256", url: "https://www.techmahindra.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png", url: "https://www.meta.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/960px-Netflix_2015_logo.svg.png?20190206123158", url: "https://www.netflix.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg", url: "https://www.spotify.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png", url: "https://www.uber.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg", url: "https://www.airbnb.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg", url: "https://www.tesla.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg", url: "https://www.paypal.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/512px-Shopify_logo_2018.svg.png?20240107131458", url: "https://www.shopify.com" },
  { logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg", url: "https://www.zoom.us" },
];

const row1 = companies.slice(0, 10);
const row2 = companies.slice(10, 20);
const row3 = companies.slice(20, 30);

const Placements = () => {
  const rowStyle = (direction) => ({
    display: "flex",
    width: "max-content",
    animation: `${direction} 20s linear infinite`,
  });

  const containerStyle = {
    overflow: "hidden",
    whiteSpace: "nowrap",
    margin: "20px 0",
  };

  const logoStyle = {
    width: "120px",
    height: "60px",
    objectFit: "contain",
    margin: "15px",
    transition: "transform 0.3s ease",
    cursor: "pointer",
  };

  const scrollLeft = `
    @keyframes left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `;
  const scrollRight = `
    @keyframes right {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
  `;

  const renderRow = (row, direction) => (
    <div style={containerStyle}>
      <div style={rowStyle(direction)}>
        {[...row, ...row].map((c, i) => (
          <a key={`${c.url}-${i}`} href={c.url} target="_blank" rel="noopener noreferrer">
            <img
              src={c.logo}
              alt={`logo-${i}`}
              style={logoStyle}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div id="placements" style={{ textAlign: "center", padding: "40px", background: "#f5f5f5" }}>
      <style>{scrollLeft}</style>
      <style>{scrollRight}</style>
      <h2 style={{ fontSize: "3rem", marginBottom: "10px" }}>Our Placements</h2>
      <p style={{ fontSize: "1rem", marginBottom: "30px" }}>
        We are proud to have collaborated with top companies globally.
      </p>

      {renderRow(row1, "left")}
      {renderRow(row2, "right")}
      {renderRow(row3, "left")}
    </div>
  );
};

export default Placements;
