#!/usr/bin/perl

open(FILE,"cities.txt");
@lines = <FILE>;
close(FILE);

%results;
%dbold;
%db;

foreach $line (@lines){
	$line =~ s/[\n\r]//g;
	($id,$name,$ascii,$alt,$lat,$lon,$cc,$pop) = split(/\t/,$line);
	
	$pop2 = int($pop/15000);
	$lat = sprintf("%.4f",$lat);
	$lon = sprintf("%.4f",$lon);
	
	if($name eq $ascii){
		$line = "$id\t$name\t\t$cc\t$pop2";
	}else{
		$line = "$id\t$name\t$ascii\t$cc\t$pop2";	
	}

	if(!$ascii){ $ascii = $name; }
	$fl = "";
	if($ascii){
		$fl = lc(substr($ascii,0,1));
	}else{
#		$fl = lc(substr($name,0,1));
	}

	if($fl){
		$dbold{$id} = "$line";
		$n = @{$results{$fl}};
		if(!$n){ $n = 0 };
		
		if($name =~ /Mumbai/){
			#print "Mumbai = $fl-$n\n";
		}
		$db{$fl."-".$n} = "$lat\t$lon\t$pop";
		push(@{$results{$fl}},$line);
	}
}

foreach $l (keys(%results)){
	$n = @{$results{$l}};
	open(FILE,">","ranked-$l.csv");
	for($i = 0; $i < $n; $i++){
		if($i > 0){ print FILE "\n"; } 
		$out = $results{$l}[$i];
		$out =~ s/^([^\t]+)\t//g;
		$id = $1;
		if($out =~ /Mumbai/){
			#print "$l-$i\n";
		}
		open(CITY,">","cities/".$l."-".$i.".txt");
		print CITY "".$db{$l."-".$i}."\n";
		close(CITY);
		print FILE "$out";
	}
	close(FILE);
}
#print $results{'Z'};