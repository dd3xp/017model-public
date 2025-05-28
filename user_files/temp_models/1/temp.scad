module blade() {
    // Blade dimensions: 90cm long, 5cm wide, 0.5cm thick
    length = 900;
    width = 50;
    thickness = 5;
    
    // Create double-edged blade with pointed tip
    hull() {
        translate([0, 0, length/2]) 
            cube([width, thickness, 0.1], center=true);
        translate([0, 0, -length/2]) 
            cube([1, thickness, 0.1], center=true);
    }
}

module hilt() {
    // Hilt dimensions: 20cm long, 3cm diameter
    length = 200;
    diameter = 30;
    
    // Create tapered cylindrical hilt
    cylinder(h=length, d1=diameter*0.9, d2=diameter, center=true);
}

module guard() {
    // Guard dimensions: 15cm long, 2cm wide, 0.3cm thick
    length = 150;
    width = 20;
    thickness = 3;
    
    // Create rounded rectangular guard
    hull() {
        for (x = [-1, 1], y = [-1, 1]) {
            translate([x*(length/2 - width/2), y*(width/2 - width/2), 0])
                cylinder(d=width, h=thickness, center=true);
        }
    }
}

module pommel() {
    // Pommel dimensions: 4cm diameter
    diameter = 40;
    
    // Create spherical pommel with flattened base
    difference() {
        sphere(d=diameter);
        translate([0, 0, -diameter/2])
            cube([diameter, diameter, diameter], center=true);
    }
}

module sword() {
    // Assemble all sword components
    
    // Blade positioned above origin
    translate([0, 0, 450]) blade();
    
    // Hilt positioned below origin
    translate([0, 0, -100]) hilt();
    
    // Guard positioned at origin (between blade and hilt)
    rotate([90, 0, 0]) guard();
    
    // Pommel positioned at bottom of hilt
    translate([0, 0, -200]) pommel();
}

sword();