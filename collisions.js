'use strict';
(function(){

	var canvas = document.querySelector(".canvas");
	var ctx = canvas.getContext('2d');


	window.runCollisions = function(){
		run();
	};

	// Возвращает случайное число между min (включительно) и max (не включая max)
	function getRandom(min, max) {		
	  	return Math.random() * (max - min) + min;
	}
	
	function Ball () {		
		if (!(this instanceof Ball)) {			
			return new Ball();
		}

		this.radius = getRandom(1, 10);
		this.mass = this.radius;
		this.rx = getRandom(this.radius + 1, canvas.width - this.radius - 1);		
		this.ry = getRandom(this.radius + 1, canvas.height - this.radius - 1);
		this.vx = getRandom(-1, 1);
		this.vy = getRandom(-1, 1);
		this.color = parseInt(getRandom(0, Math.pow(2,24)),10).toString(16);		
		this.count = 0;

		this.move = function(dt){						
			this.rx = this.rx + this.vx*dt;
			this.ry = this.ry + this.vy*dt;						
		};

		this.draw = function(ctx){
			var path = new Path2D();
			path.arc(this.rx, this.ry, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = "#"+this.color;
			ctx.fill(path);			
		};

		//calculate time to hit another particle
		this.timeToHit = function(b){
			var a = this;
	        if (a == b) return Infinity;
	        var dx  = b.rx - a.rx;
	        var dy  = b.ry - a.ry;
	        var dvx = b.vx - a.vx;
	        var dvy = b.vy - a.vy;
	        var dvdr = dx*dvx + dy*dvy;
	        if (dvdr > 0) return Infinity;

	        var dvdv = dvx*dvx + dvy*dvy;
	        var drdr = dx*dx + dy*dy;
	        var sigma = a.radius + b.radius;
	        var d = (dvdr*dvdr) - dvdv * (drdr - sigma*sigma);
	        if (drdr < sigma*sigma) console.log("overlapping particles");
	        if (d < 0) return Infinity;
	        return -(dvdr + Math.sqrt(d)) / dvdv;
		};

		this.timeToHitVerticalWall = function(){			
			if 		(this.vx > 0) 	return (canvas.width - this.rx - this.radius) / this.vx;
			else if (this.vx < 0) 	return (this.radius - this.rx) / this.vx;
			else 					return Infinity;
		};

		this.timeToHitHorizontalWall = function(){
			if 		(this.vy > 0) 	return (canvas.height - this.ry - this.radius) / this.vy;
			else if (this.vy < 0) 	return (this.radius - this.ry) / this.vy;
			else 					return Infinity;
		};

		this.bounceOff = function(that){
			if (!(that instanceof Ball)) 
				{ throw new "that should be instance of Ball"; }
			var dx = that.rx - this.rx, dy = that.ry - this.ry;
			var dvx = that.vx - this.vx, dvy = that.vy - this.vy;
			var dvdr = dx*dvx + dy*dvy;
			var dist = this.radius + that.radius;

			var J = 2 * this.mass * that.mass * dvdr / ((this.mass + that.mass) * dist);
			var Jx = J * dx / dist;
			var Jy = J * dy / dist;
			
			this.vx += Jx / this.mass;
			this.vy += Jy / this.mass;
			that.vx -= Jx / that.mass;
			that.vy -= Jy / that.mass;

			this.count++;
			that.count++;
		};


		this.bounceOffVerticalWall = function(){
			this.vx = -this.vx;
			this.count++;
		};

		this.bounceOffHorizontalWall = function(){
			this.vy = -this.vy;
			this.count++;
		};

		this.kineticEnergy = function(){ 
			return 0.5 * this.mass * (this.vx*this.vx + this.vy*this.vy);
		};
	}// end function Ball

	function Event(t, a, b){
		this.time = t;
		this.a = a;
		this.b = b;
		var countA, countB;

		if (a != null) 	countA = a.count;
		else 			countA = -1;
		if (b != null) 	countB = b.count;
		else 			countB = -1;

		// compare times when two events will occur
		this.compareTo = function(that){
			if 		(this.time < that.time) return -1;
			else if (this.time > that.time)	return +1;
			else 							return  0;
		}

		// has any collision occurred between when event was created and now?
		this.isValid = function(){
			if (a != null && a.count != countA) return false;
			if (b != null && b.count != countB) return false;
			return true;
		}
	}

	function MinPQ(){
		var pq = [];
		var N = 0;

		this.insert = function(item){
			pq[++N] = item;
			swim(N);
		};

		this.delMin = function() {
	        if (this.isEmpty()) throw new "Priority queue underflow";
	        exch(1, N);
	        var min = pq[N--];
	        sink(1);
	        pq[N+1] = null;// avoid loitering and help with garbage collection	        
	        return min;
    	}

		function swim(k){
			while(k > 1 && greater(Math.floor(k / 2), k)){
				exch(k, Math.floor(k/2));
				k = Math.floor(k/2);
			}
		}

		function sink(k){
			while( 2*k < N){
				var j = 2*k;
				if (j < N && greater(j, j+1)) j++;
				if (!greater(k, j)) break;
				exch(k, j);
				k = j;
			}
		}

		function greater(i, j) {			
            return pq[i].compareTo(pq[j]) > 0;
    	}

    	function exch(i, j) {
	        var swap = pq[i];
	        pq[i] = pq[j];
	        pq[j] = swap;
    	}

		this.isEmpty = function(){ return N == 0; };
	}

	function CollisionSystem(particles, ctx){
		var pq = new MinPQ();
		var t = 0.0;	//clock time
		var hz = 0.5;	//number of redraw per clock time

		function predict(a, limit){
			if (a == null) return;

			//ball - ball collisions
			for(var i = 0; i < particles.length; i++){
				var dt = a.timeToHit(particles[i]);
				if (t + dt <= limit) 
					pq.insert(new Event(t + dt, a, particles[i]));
			}

			//ball - wall collisions
			var dtX = a.timeToHitVerticalWall();
			var dtY = a.timeToHitHorizontalWall();
			if (t + dtX <= limit) pq.insert(new Event(t + dtX, a, null));
			if (t + dtY <= limit) pq.insert(new Event(t + dtY, null, a));			
		}

		function redraw(limit){
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for(var i = 0; i < particles.length; i++){				
				particles[i].draw(ctx);
			}	

			if (t < limit) {
				pq.insert(new Event(t + 1.0 / hz, null, null));
			};
		}
		this.simulate = function(limit){
			pq = new MinPQ();
			for(var i = 0; i < particles.length; i++){
				predict(particles[i], limit);
			}

			pq.insert(new Event(0, null, null)); //	redraw events

			setInterval(function(){
				if(!pq.isEmpty()){		
					var e = pq.delMin();
					if (e.isValid()){
						var a = e.a;
						var b = e.b;

						//physical collision, update position and simulate clock
						for(var i = 0; i < particles.length; i++){
							particles[i].move(e.time - t);
						}

						t = e.time;

						//process event
						if 		(a != null && b != null) 	a.bounceOff(b);
						else if (a != null && b == null) 	a.bounceOffVerticalWall();
						else if (a == null && b != null)	b.bounceOffHorizontalWall();
						else if (a == null && b == null)	redraw(limit);

						predict(a, limit);
						predict(b, limit);
					}
				}
			}, 0);
			
		};

	}

	function run(){
		var N = 20;//quantity of balls
		var balls = []
		var central = new Ball();
		central.vx = 0;
		central.vy = 0;
		central.rx = canvas.width / 2;
		central.ry = canvas.height / 2;
		central.radius = 40;		
		central.mass = 10;	
		balls.push(central);
		for (var i=0; i<N; i++)
			balls.push(new Ball());
		

		var system = new CollisionSystem(balls, ctx);
		system.simulate(10000000);
		
	}

})();