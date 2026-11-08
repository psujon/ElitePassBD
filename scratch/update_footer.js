const fs = require('fs');
let s = fs.readFileSync('src/components/Footer.jsx', 'utf8');

s = s.replace(
  '<li><Link to="/about" className="hover:text-blue-600 transition-colors">Our Partners</Link></li>',
  '<li><Link to="/partners" className="hover:text-blue-600 transition-colors">Our Partners</Link></li>'
);

s = s.replace(
  '<li><Link to="/privacy" className="hover:text-blue-600 transition-colors">DMCA Policy</Link></li>',
  '<li><Link to="/dmca" className="hover:text-blue-600 transition-colors">DMCA Policy</Link></li>'
);

fs.writeFileSync('src/components/Footer.jsx', s, 'utf8');
console.log("Footer.jsx updated successfully.");

