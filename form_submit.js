// $('#patient_details').on('submit', function(e) {
// 	e.preventDefault();
// 	pt = build_pt()
// 	pt = get_subtype(pt)
// 	window.pt = pt
// 	console.log(pt)
// 	render_diagnosis(pt, '#output', '#alerts')
// })

function run_subtype(){
	pt = build_pt()
	pt = get_subtype(pt)
	window.pt = pt
	console.log(pt)
	render_diagnosis(pt, '#output', '#alerts')
}

function run_ipssr(){
	pt = build_pt()
	pt = IPSSR(pt)
	window.pt = pt
	console.log(pt)

	render_ipssr(pt, '#output', '#alerts')
}



function build_pt(){
	var pt = {"_alerts" : [], 'cytogenetics':{}}
	//cytogenetics only stores names of checked mutations

	//checkbox elements
	var chb = $(':checkbox')
	chb.each(function(){
		if(this.id.startsWith('cytogenetics_')){
			if(this.checked){
				pt['cytogenetics'][this.name] = this.checked
			}
		} else {
			pt[this.name] = this.checked
		}
	})

	//number elements
	var num = $(':input[type="number"]')
	num.each(function(){
		pt[this.name] = parseFloat(this.value)
	})

	//radio groups
	pt['lineages'] = $('input[name=lineages]:checked').val();
	pt['sf3b1'] = $('input[name=sf3b1]:checked').val();

	//extra processing
	//count cytopenias
	var cytopenias = ["anemia", "neutropenia", "thrombocytopenia"]
	pt['cytopenias_count'] = cytopenias.reduce(function (accumulator, currentValue) {
	  return accumulator + pt[currentValue];
	}, 0)


	return pt
}

function render_diagnosis(pt, result_id, alert_id){
	$(result_id).text(pt['_diagnosis']['summary'])

	var start = '<div class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Warning: </strong>'
	var end = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button</div>'
	$(alert_id).empty()
	pt['_alerts'].forEach(function(el){

		$(alert_id).append(start + el + end)
	})
}

function render_ipssr(pt, result_id, alert_id){
	var start = '<div class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Warning: </strong>'
	var end = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button</div>'
	$(alert_id).empty()

	if(pt['_IPSSR']['score_is_final']){
		$(result_id).text("IPSS-R score: " + pt['_IPSSR']['score'] + ", risk: " + pt['_IPSSR']['risk'])
	} else {
		$(result_id).text("Provisional IPSS-R score: " + pt['_IPSSR']['provisional_score'] + ", risk: " + pt['_IPSSR']['provisional_risk'])
		var msg = 'Risk is provisional due to missing components: ' + pt['_IPSSR']['missing'].join(', ')
		$(alert_id).append(start + msg + end)
	}

	pt['_alerts'].forEach(function(el){
		$(alert_id).append(start + el + end)
	})
}

