let V = new Uint8Array(16);
let I = new Uint16Array(1);

let memory = new Uint8Array(4095);
let PC = new Uint16Array(1);

let stack = new Uint16Array(16);
let SP = new Uint8Array(1);
SP[0] = -1;

let instructions = [
  {
    // MOVE const
    matcher: '6xkk',
    exec: (x,kk) => V[x] = kk
  },
  {
    // MOVE 
    matcher: '8xy0',
    exec: (x,y) => V[x] = V[y]
  },
  {
    // ADD const
    matcher: '7xkk',
    exec: (x,kk) => V[x] += kk
  },
  {
    // ADD
    matcher: '8xy4',
    exec: (x,y) => { 
      let sum = V[x] + V[y];
      V[x] = sum;
      V[0xf] = V[x] !== sum; // set carry if overflow 
    }
  },
  {
    // SUB
    matcher: '8xy5',
    exec: (x,y) => {
      V[0xf] = V[x] > V[y]; // borrowing
      V[x] = V[x] - V[y];
    }
  },
  {
    // SUBN
    matcher: '8xy7',
    exec: (x,y) => {
      V[0xf] = V[y] > V[x]; // borrowing
      V[x] = V[y] - V[x];
    }
  },
  { 
    // AND
    matcher: '8xy2',
    exec: (x,y) => V[x] &= V[y]
  },
  { 
    // OR
    matcher: '8xy1',
    exec: (x,y) => V[x] |= V[y] 
  },
  { 
    // XOR
    matcher: '8xy3',
    exec: (x,y) => V[x] ^= V[y] 
  },
  {
    // SHR
    matcher: '8xy6',
    exec: (x,y) => 
    {
      V[0xf] = x & 1;
      V[x] >>= 1; 
    }
  },
  {
    // SHL
    matcher: '8xyE',
    exec: (x,y) => {
      V[0xf] = x & 0x80;
      V[x] <<= 1;
    } 
  },
  {
    // RND
    matcher: 'Cxkk',
    exec: (x,kk) => V[x] = (Math.random() * 0xFF | 0) & kk
  },
  {
    // MOVE I
    matcher: 'Annn',
    exec: (nnn) => I[0] = nnn
  },
  {
    // ADD I
    matcher: 'Fx1E',
    exec: (x) => I[0] += V[x]
  },
  {
    // SKIP_EQ const
    matcher: '3xkk',
    exec: (x,kk) => PC[0] += (x === kk)
  },
  {
    // SKIP_NEQ const
    matcher: '4xkk',
    exec: (x,kk) => PC[0] += (x !== kk)
  },
  {
    // SKIP_EQ
    matcher: '5xy0',
    exec: (x,y) => PC[0] += (x === y)
  },
  {
    // SKIP_NEQ
    matcher: '9xy0',
    exec: (x,y) => PC[0] += (x !== y)
  },
  {
    // JMP
    matcher: 'Bnnn',
    // -1 because the PC will be incremented later
    exec: (nnn) => PC[0] = V[0x0] + nnn - 1 
  },
  {
    // WRITE
    matcher: 'Fx55',
    exec: (x) => {
      for (let i = 0; i <= x; ++i) 
        memory[I[0]+i] = V[i];
    }
  },
  {
    // READ
    matcher: 'Fx65',
    exec: (x) => {
      for (let i = 0; i <= x; ++i) 
        V[i] = memory[I[0]+i];
    }
  },
  {
    // WRITE_BCD
    matcher: 'Fx65',
    exec: (x) => {
      let n = V[x];
      let h = n / 100 | 0;
      n -= 100 * h;
      let d = n / 10 | 0;
      n -= 10 * d;
      
      memory[I[0] + 0] = h;
      memory[I[0] + 1] = d;
      memory[I[0] + 2] = n;
    }
  },
  {
    // CALL
    matcher: '2nnn',
    exec: (nnn) => {
      ++SP[0];
      stack[SP[0]] = PC[0];
      PC[0] = nnn - 1;
    }
  },
  {
    // RET
    matcher: '00EE',
    exec: () => {
      PC[0] = stack[SP[0]] - 1;
      --SP[0];
    }
  },
];

function createMatcher(opcode) {
  let matcher = '^';
  let kCount = 0, nCount = 0;
  for (let c of opcode) {
    switch (c) {
    case 'x':
    case 'y':
      matcher += '([0-9a-f])';
      break;
    case 'k':
      if (!kCount)
        matcher += '([0-9a-f]{2})';
      ++kCount;
      break;
    case 'n':
      if (!nCount)
        matcher += '([0-9a-f]{3})';
      ++nCount;
      break;
    default:
      matcher += c;
      break;
    }
  }
  matcher += '$';
  return new RegExp(matcher, 'i');
}


function execute(instr) {
  for (let i of instructions) {
    if (instr.match(createMatcher(i.matcher)))
      i.exec(
        parseInt(RegExp.$1, 16),
        parseInt(RegExp.$2, 16)
      );
  }
} 

exports.V = V;
exports.I = I;
exports.execute = execute;
