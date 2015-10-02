'use strict';
(function(){

	var canvas = document.querySelector(".canvas2");
	var ctx = canvas.getContext('2d');

	window.runGravity = function(){
		run();		
	};
	
	function getRandom(min, max) {		
	  	return Math.random() * (max - min) + min;
	}
	
	function Ball () {		
		if (!(this instanceof Ball)) {			
			return new Ball();
		}

		this.radius = getRandom(5, 10);
		this.mass = this.radius;
		this.rx = getRandom(this.radius + 1, canvas.width - this.radius - 1);		
		this.ry = getRandom(this.radius + 1, canvas.height - this.radius - 1);
		this.vx = getRandom(-1, 1);
		this.vy = getRandom(-1, 1);
		this.color = parseInt(getRandom(0, Math.pow(2,24)),10).toString(16);		
		this.count = 0;

		this.move = function(dt){				
				
			//simulates gravity			
			this.vy += 0.1;
			var impulseAbsorbtion = 0.5;
			//if (Math.abs(this.vy) < 0.2) this.vy = 0;

			if ((this.rx + this.vx*dt < this.radius) || (this.rx + this.vx*dt > canvas.width - this.radius)) { this.vx = -this.vx * impulseAbsorbtion; this.vy = this.vy * impulseAbsorbtion}
			if ((this.ry + this.vy*dt < this.radius) || (this.ry + this.vy*dt > canvas.height - this.radius)) { this.vy = -this.vy * impulseAbsorbtion; this.vx = this.vx * impulseAbsorbtion}
			

			this.rx = this.rx + this.vx*dt;
			this.ry = this.ry + this.vy*dt;			
			
		};

		this.draw = function(ctx){
			var path = new Path2D();
			path.arc(this.rx, this.ry, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = "#"+this.color;
			ctx.fill(path);			
		};		

		this.kineticEnergy = function(){ 
			return 0.5 * this.mass * (this.vx*this.vx + this.vy*this.vy);
		};
	}// end function Ball	

	function run(){
		var N = 100;//quantity of balls
		var balls = []
		var central = new Ball();
		central.vx = 1;
		central.vy = 1;
		central.rx = canvas.width / 2;
		central.ry = canvas.height / 2;
		central.radius = 40;	
		central.mass = 100;	
		balls.push(central);

		for (var i=0; i<N; i++)
			balls.push(new Ball());
		
		setInterval(function(){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for(var i = 0; i < N; i++){				
				balls[i].move(0.5);
				balls[i].draw(ctx);
			}								
		}, 1);		
		
		
	}

})();