convert "./*.jpg[250x]" -set filename:base "%[base]" "./%[filename:base].jpg"
convert "./*.jpeg[250x]" -set filename:base "%[base]" "./%[filename:base].jpeg"
convert "./*.png[250x]" -set filename:base "%[base]" "./%[filename:base].png"

convert "./*.jpg[x400]" -set filename:base "%[base]" "./%[filename:base].jpg"
convert "./*.jpeg[x400]" -set filename:base "%[base]" "./%[filename:base].jpeg"
convert "./*.png[x400]" -set filename:base "%[base]" "./%[filename:base].png"
