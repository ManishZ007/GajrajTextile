'use client';

function Bone({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background:
          'linear-gradient(90deg, #EDE8E3 25%, #F5F1EC 50%, #EDE8E3 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s infinite',
        borderRadius: '8px',
        ...style,
      }}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div
      className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14"
      style={{ background: '#ffffff' }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left — gallery skeleton */}
        <div className="lg:w-[45%] flex gap-3">
          <div className="hidden sm:flex flex-col gap-2.5">
            {[...Array(4)].map((_, i) => (
              <Bone
                key={i}
                style={{ width: '56px', height: '72px', borderRadius: '12px' }}
              />
            ))}
          </div>
          <Bone
            style={{
              flex: 1,
              minHeight: '480px',
              maxHeight: '660px',
              borderRadius: '18px',
            }}
          />
        </div>

        {/* Right — info skeleton */}
        <div className="lg:w-[55%] space-y-5 pt-1">
          <Bone style={{ width: '90px', height: '11px' }} />
          <Bone style={{ width: '70%', height: '38px', borderRadius: '6px' }} />
          <Bone
            style={{ width: '130px', height: '26px', borderRadius: '6px' }}
          />
          <Bone
            style={{ width: '76px', height: '22px', borderRadius: '999px' }}
          />

          <div className="space-y-2 pt-3">
            {[100, 92, 96, 80, 68].map((w, i) => (
              <Bone key={i} style={{ width: `${w}%`, height: '13px' }} />
            ))}
          </div>

          <div
            style={{
              paddingTop: '6px',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Bone
              style={{ width: '80px', height: '10px', marginBottom: '14px' }}
            />
            <div className="flex gap-2.5">
              {[...Array(5)].map((_, i) => (
                <Bone
                  key={i}
                  style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              paddingTop: '6px',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Bone
              style={{ width: '60px', height: '10px', marginBottom: '14px' }}
            />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Bone style={{ width: '50px', height: '9px' }} />
                  <Bone style={{ width: '90px', height: '13px' }} />
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex gap-3 pt-2"
            style={{
              paddingTop: '8px',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Bone style={{ flex: 1, height: '52px', borderRadius: '16px' }} />
            <Bone
              style={{ width: '155px', height: '52px', borderRadius: '16px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
