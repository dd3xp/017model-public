module cherry() {
    // Stem
    color("green")
    translate([0, 0, 5])
    rotate([0, 90, 0])
    cylinder(h=10, r=0.5, center=true, $fn=32);
    
    // Fruit
    color("red")
    sphere(r=5, $fn=64);
}

cherry();