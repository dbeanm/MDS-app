//check for isNaN for numeric fields

function get_subtype(pt){
	//checks and alerts
	//sideroblasts
	if (isNaN(pt['ringed_sideroblasts'])){
		pt['_alerts'].push("Missing ringed sideroblasts count, assuming none seen")
	}

	pt['_diagnosis'] = {}
    pt['_diagnosis']['summary'] = "unknown"
    pt['_diagnosis']['comment'] = []
    if (pt['blast_count'] > 1.5){
        console.log("RAEB path")
        pt['_diagnosis']['summary'] = "RAEB"
    } else {
        console.log("Not RAEB")
        if(pt['cytogenetics'].hasOwnProperty('5q')){
        	console.log("isolated 5q-")
        	pt['_diagnosis']['summary'] = "isolated 5q-"
        }
            
            
        // elif pt['_5qminus'] == "likely 5q":
        //     print "likely 5q-"
        //     pt['_diagnosis']['summary'] = "likely isolated 5q-"
        //     pt['_diagnosis']['comment'].append(pt['_5qminus']['comment'])
        else if (pt['cytopenias_count'] == 3){
        	console.log("pancytopenic")
            if (pt['lineages'] == 'unilineage'){
                pt['_diagnosis']['summary'] = "MDS-U"
            } else if (pt['lineages']  == 'multilineage'){
            	//ringed sideroblasts
                if (pt['ringed_sideroblasts'] > 15 || (pt['ringed_sideroblasts'] >= 5 && pt['ringed_sideroblasts'] <= 15 && pt['sf3b1'] == 'sf3b1_mutated')){
                    pt['_diagnosis']['summary'] = "MDS-RS-MLD"

                //none seen    
                } else if (pt['ringed_sideroblasts'] == 0 || isNaN(pt['ringed_sideroblasts'])){
                    pt['_diagnosis']['summary'] = "RCMD"

                //likely ringed sideroblasts pending SF3B1    
                } else if(pt['ringed_sideroblasts'] >= 5 && pt['ringed_sideroblasts'] <= 15 && pt['sf3b1'] == "sf3b1_unknown"){
                    pt['_diagnosis']['summary'] = "RCMD or MDS-RS-MLD pending SF3B1"

                //likely ringed, SF3B1 mutated, check iron
                } else if ((pt['ringed_sideroblasts'] == 0 || isNaN(pt['ringed_sideroblasts'])) && pt['sf3b1'] == 'sf3b1_mutated'){
                    pt['_diagnosis']['summary'] = "SF3B1 mutated - likely ringed sideroblasts, check iron status"

                //catch anything else      
                } else {
                	pt['_diagnosis']['summary'] = "Exception under unilineage iron stain results, cannot diagnose"
                } 
            } else { 
                pt['_diagnosis']['summary'] = "Pancytopenic MDS, subtype unknown"
                pt['_alerts'].push('check number of lineages')
            }
        }
            
        else if (pt['cytopenias_count'] < 3){
            console.log("not pancytopenic")
            //ringed
            if (pt['ringed_sideroblasts'] > 15 || (pt['ringed_sideroblasts'] >= 5 && pt['ringed_sideroblasts'] <= 15 && pt['sf3b1'] == 'sf3b1_mutated')){
                if (pt['lineages']  == 'multilineage'){
                    pt['_diagnosis']['summary'] = "MDS-RS-MLD"
                } else if (pt['lineages']  == 'uniilineage'){
                    pt['_diagnosis']['summary'] = "MDS-RS-SLD"
                } else {
                    pt['_diagnosis']['summary'] = "unknown number of dysplastic lineages - MDS-RS-MLD or MDS-RS-SLD"
                }

            //likely ringed pending SF3B1    
            } else if(pt['ringed_sideroblasts'] >= 5 && pt['ringed_sideroblasts'] <= 15 && pt['sf3b1'] == "sf3b1_unknown"){
                if (pt['lineages']  == 'multilineage'){
                    pt['_diagnosis']['summary'] = "RCMD or MDS-RS-MLD pending SF3B1"
                } else if (pt['lineages']  == 'unilineage'){
                    pt['_diagnosis']['summary'] = "RCUD or MDS-RS-SLD pending SF3B1"
                }

            //mutated, likely ringed    
            } else if ((pt['ringed_sideroblasts'] == 0 || isNaN(pt['ringed_sideroblasts'])) && pt['sf3b1'] == 'sf3b1_mutated'){
                if (pt['lineages']  == 'multilineage'){
                    pt['_diagnosis']['summary'] = "RCMD or MDS-RS-MLD pending iron stain"
                } else if (pt['lineages']  == 'uniilineage'){
                    pt['_diagnosis']['summary'] = "RCUD or MDS-RS-SLD pending iron stain"
                }
            } else {
            	//not sure if this block will ever be entered. Maybe only iron negtive or missing AND mutation normal or not done?

                //iron non seen or unknown
                console.log("iron negative or missing")
                if (pt['lineages']  == 'multilineage'){
                    console.log("multilineage")
                    if (pt['blast_count'] >= 0.5 && pt['blast_count'] <= 1.5){
                        console.log("check blast count")
                        pt['_diagnosis']['summary'] = "if pb blast count < 0.5 then RCMD, else MDS-U"
                    } else {
                        console.log("RCMD diagnosis")
                        pt['_diagnosis']['summary'] = "RCMD"
                    }
                } else if (pt['lineages']  == 'unilineage'){
                    if (pt['blast_count'] >= 0.5 && pt['blast_count'] <= 1.5){
                        pt['_diagnosis']['summary'] = "if pb blast count < 0.5 then RCUD, else MDS-U"
                    } else{
                        pt['_diagnosis']['summary'] = "RCUD"                        
                    }
                } else if (pt['lineages']  == 'no dysplasia'){
                    if (pt['mds_defining_cyto']){
                    	pt['_diagnosis']['summary'] = "MDS-U"
                        pt['_alerts'].push("MDS-defining cytogenetic abnormality but no dysplasia")
                    } else {
                        pt['_diagnosis']['summary'] = "No evidence of dysplasia"
                    }
                } else {
                	//unknown dysplasia
                    if (pt['blast_count'] >= 0.5 && pt['blast_count'] <= 1.5){
                        pt['_diagnosis']['summary'] = "if pb blast count < 0.5 then unknown subtype ?RCUD ?RCMD"
                    } else {
                        pt['_diagnosis']['summary'] = "lineages of dysplasia unknown ?RCUD ?RCMD"
                    }
                }
                    
            }
        }
    }

    return pt
}

function IPSSR(pt){
	all_scores = {}
    //cytogenetics
    //cyto_result means there is cytogenetic data
    //cyto_score is the final score
    
    check_3pt = ['t(3:21)(q26q22)', 'inv(3)(q21q26)', 'Del 3q']
    pt_check_3pt = check_3pt.reduce(function(acc, curr){
    	return acc || pt['cytogenetics'].hasOwnProperty(curr)
    }, false)
    
    check_1pt = ['5q', 'Del (12p)', '20q']
    pt_check_1pt = check_1pt.reduce(function(acc, curr){
    	return acc || pt['cytogenetics'].hasOwnProperty(curr)
    }, false)
    
    check_1pt_5q = ['7q', 'Trisomy 8', 'Trisomy 19', 'i(17q)'].concat(check_3pt)
    pt_check_1pt_5q = check_1pt_5q.reduce(function(acc, curr){
    	return acc || pt['cytogenetics'].hasOwnProperty(curr)
    }, false)
    
    check_0pt = ['Del Y', 'Del (11q)']
    pt_check_0pt = check_0pt.reduce(function(acc, curr){
    	return acc || pt['cytogenetics'].hasOwnProperty(curr)
    }, false)
    
    long_2pt = pt_check_3pt || pt_check_1pt || pt_check_0pt
    
    check_2pt = ['5q', '7q'].concat(check_3pt)
    pt_short_2pt = check_2pt.reduce(function(acc, curr){
    	return acc || pt['cytogenetics'].hasOwnProperty(curr)
    }, false)
 
 //below here not converted
 //need a way to check whether any test result was not done vs just not entered
    cyto_result = true
    var n_checked = Object.keys(pt['cytogenetics']).length
    var number_of_cyto_changes = pt['total_cyto_changes']

    if(isNaN(pt['total_cyto_changes']) && n_checked == 0){
    	//if nan total and nothing checked, assumed that result is missing
    	cyto_result = false
    } else if(isNaN(pt['total_cyto_changes']) && n_checked > 0){
    	number_of_cyto_changes = n_checked
    	pt['_alerts'].push("Assuming checked cytogenetic changes are the only changes")
    } else if (pt['total_cyto_changes'] < n_checked){
    	cyto_result = false //numbers are not consistent and no reasonable guess
    	pt['_alerts'].push("Number of cytogenetic changes entered not consistent")
    }

    cyto_score = undefined
    if (pt_check_0pt && number_of_cyto_changes  == 1){
        cyto_score = 0
    }
       
    if (number_of_cyto_changes  == 0){
        cyto_score = 1
    }
    if (number_of_cyto_changes  == 1 && pt_check_1pt){
        cyto_score = 1
    }
    if (number_of_cyto_changes  == 2 && pt['cytogenetics'].hasOwnProperty('5q') && !pt_check_1pt_5q){
        cyto_score = 1
    }
        
    if(number_of_cyto_changes  == 2 && !pt_short_2pt){
        cyto_score = 2
    }
    if (number_of_cyto_changes  == 1 && !long_2pt){
        cyto_score = 2
    }
        
    if(number_of_cyto_changes  == 3){
        cyto_score = 3
    }
    if(pt_check_3pt){
        cyto_score = 3
    }
    if (pt['cytogenetics'].hasOwnProperty('7q') && number_of_cyto_changes  == 2){
        cyto_score = 3
    }
    
    if (number_of_cyto_changes  > 3){
        cyto_score = 4
    }

    all_scores['cyto_score'] = cyto_score

    //BM Blast
    if(isNaN(pt['bm_blast_score'])){
    	bm_blast_score = undefined
    } else {
    	bm_blast_score = pt['bm_blast_score']
    }
    all_scores['bm_blast_score'] = bm_blast_score
    
    //haem
    haem_score = undefined
    if (pt['haemoglobin'] < 80 || pt['rbc_transfusion']){
        haem_score = 1.5
    }
    else if (pt['haemoglobin'] < 100 || pt['EPO']){
        haem_score = 1
    }
    else if (pt['haemoglobin'] >= 100){
        haem_score = 0
    }
    all_scores['haem_score'] = haem_score
        
    //platelets
    plt_score = undefined
    if (pt['platelets'] < 50 || pt['plt_transfusion']){
        plt_score = 1
    }
    else if (pt['platelets'] < 100){
        plt_score = 0.5
    }
    else if (pt['platelets'] >= 100){
        plt_score = 0
    }
    all_scores['plt_score'] = plt_score

    //neut
    neut_score = undefined
    if (pt['neutrophils'] < 0.8 || pt['gcsf']){
        neut_score = 0.5
    }
    else if (pt['Neutrophil count'] >= 0.8){
        neut_score = 0
    }
    all_scores['neut_score'] = neut_score
    
    //get score values and names of missing elements
    all_score_vals = []
    missing = []
    var score_names = Object.keys(all_scores)
    score_names.forEach(function(el){
    	if (typeof all_scores[el] != 'undefined'){
    		all_score_vals.push(all_scores[el])
    	} else {
    		missing.push(el)
    	}
    })
    
    //for cyto score we assume a normal score of 1 if the result is missing
    //that means it won't come up as missing which is normally undefined
    if (missing.indexOf('cyto_score') == -1 && !cyto_result){
        missing.append('cyto_score')
    }
    provisional_score = all_score_vals.reduce(function (accumulator, currentValue) {
	  return accumulator + currentValue;
	}, 0);
    
    //risk
    provisional_risk = undefined
    if (provisional_score <= 1.5){
        provisional_risk = "Very low"
    } else if (provisional_score <=3){
        provisional_risk = "Low"
    } else if (provisional_score <= 4.5){
        provisional_risk = "Intermediate"
    } else if (provisional_score <= 6){
        provisional_risk = "High"
    } else if (provisional_score > 6){
        provisional_risk = "Very high"
    } else {
        console.log( "ERROR: Risk not defined for pt")
        provisional_risk = undefined
        pt['_alerts'].push("Risk level not defined for patient")
    }

    if (missing.length == 0){
        risk = provisional_risk
        score = provisional_score
        score_final = true
    } else {
        risk = "Failed"
        score = "Failed"
        score_final = false
    }
    
    result = {'score': score, 'risk': risk, 'missing': missing, 'components': all_scores}
    result['provisional_score'] = provisional_score
    result['provisional_risk'] = provisional_risk
    result['score_is_final'] = score_final
    pt['_IPSSR'] = result
    return pt

}