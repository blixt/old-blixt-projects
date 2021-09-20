var CanvasRenderer = new Class({
    canvas: null,
    height: 300, width: 400,
    offsetX: 0, offsetY: 0,
    scale: 1.0,
    physics: null,

    initialize: function (physics) {
        this.physics = physics;

        this.canvas = new Element('canvas', {
            styles: {
                border: '#000 solid 1px'
            },
            height: this.height,
            width: this.width
        }).inject(document.body);

        physics.addObserver(this);
    },
    
    center: function (x, y) {
        this.offsetX = -x + this.width / 2;
        this.offsetY = -y + this.height / 2;
    },
    
	step: function () {
		var context = this.canvas.getContext('2d');
		with (context) {
			save();

			fillStyle = '#fff';
			fillRect(0, 0, this.canvas.width, this.canvas.height);

            strokeStyle = '#ddd';

            var x = this.offsetX % 40, y = this.offsetY % 40;
            while (x < this.canvas.width) {
                beginPath();
                moveTo(x, 0);
                lineTo(x, this.canvas.height);
                stroke();
                
                x += 40;
            }

            while (y < this.canvas.height) {
                beginPath();
                moveTo(0, y);
                lineTo(this.canvas.width, y);
                stroke();
                
                y += 40;
            }

			scale(this.scale, this.scale);

            for (var i = 0; i < this.physics.constraints.length; i++) {
                var c = this.physics.constraints[i];

                if (c.meta.visible === false) continue;
                strokeStyle = c.meta.color || '#000';
                lineWidth = c.meta.width || 2;

                beginPath();
                moveTo(c.atom1.x + this.offsetX, c.atom1.y + this.offsetY);
                lineTo(c.atom2.x + this.offsetX, c.atom2.y + this.offsetY);
                stroke();
            }

            for (var i = 0; i < this.physics.atoms.length; i++) {
                var a = this.physics.atoms[i];

                if (a.meta.visible === false) continue;
                fillStyle = a.meta.color || '#000';

                beginPath();
                arc(a.x + this.offsetX, a.y + this.offsetY, (a.meta.size || 2), 0, Math.PI * 2, true);
                fill();
            }

			restore();
		}
	},

	setSize: function (w, h) {
		this.height = h;
		this.width = w;

        this.canvas.height = h;
        this.canvas.width = w;
	}
});
