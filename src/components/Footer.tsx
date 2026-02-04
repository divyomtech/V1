import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src="/logo.png" alt="He&She Logo" className="h-10 w-auto mb-4 bg-white/10 p-1 rounded" />
            <h3 className="text-xl font-bold text-primary mb-2">He&She</h3>
            <p className="text-background/80 mb-4">
              Your trusted partner in finding the perfect PG accommodation across India.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">List Your PG</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For PG Seekers</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Find PG</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Boys PG</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Girls PG</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Unisex PG</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-background/80">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-background/80">
                <Mail className="h-4 w-4" />
                <span>support@heandshe.com</span>
              </li>
              <li className="flex items-start gap-2 text-background/80">
                <MapPin className="h-4 w-4 mt-1" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/60">
          <p>&copy; 2025 He&She PG Booking. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
