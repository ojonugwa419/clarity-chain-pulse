;; ChainPulse Contract
;; Monitors and stores blockchain activity metrics

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-time (err u101))
(define-constant err-no-data (err u102))
(define-constant err-invalid-input (err u103))
(define-constant page-size u50)

;; Data structures
(define-map activity-metrics uint 
  { 
    timestamp: uint,
    tx-count: uint,
    volume: uint,
    active-addresses: uint
  }
)

(define-data-var last-record-id uint u0)
(define-data-var total-records uint u0)

;; Events
(define-data-var last-event-id uint u0)
(define-public (emit-activity-recorded (record-id uint) (timestamp uint))
  (ok (print {event: "activity-recorded", record-id: record-id, timestamp: timestamp}))
)

;; Input validation
(define-private (validate-metrics (tx-count uint) (volume uint) (active-addresses uint))
  (and (> tx-count u0) (> volume u0) (>= active-addresses u0))
)

;; Record new blockchain activity
(define-public (record-activity (tx-count uint) (volume uint) (active-addresses uint))
  (let
    (
      (current-time (get-block-info! time (- block-height u1)))
      (new-id (+ (var-get last-record-id) u1))
    )
    (if (is-eq tx-sender contract-owner)
      (if (validate-metrics tx-count volume active-addresses)
        (begin
          (map-set activity-metrics new-id
            {
              timestamp: current-time,
              tx-count: tx-count,
              volume: volume,
              active-addresses: active-addresses
            }
          )
          (var-set last-record-id new-id)
          (var-set total-records (+ (var-get total-records) u1))
          (try! (emit-activity-recorded new-id current-time))
          (ok new-id)
        )
        err-invalid-input
      )
      err-owner-only
    )
  )
)

;; Get metrics for a specific time period with pagination
(define-public (get-metrics (start-time uint) (end-time uint) (page uint))
  (if (> start-time end-time)
    err-invalid-time
    (ok (filter-metrics start-time end-time page))
  )
)

;; Generate activity report
(define-public (generate-report (record-id uint))
  (let ((metrics (map-get? activity-metrics record-id)))
    (if (is-none metrics)
      err-no-data
      (ok (some metrics))
    )
  )
)

;; Helper function to filter metrics by time range
(define-private (filter-metrics (start-time uint) (end-time uint) (page uint))
  (let
    (
      (start-idx (* page page-size))
      (end-idx (min (+ start-idx page-size) (var-get total-records)))
    )
    (filter check-time-range-closure 
      (map unwrap-metrics 
        (map (lambda (id) (map-get? activity-metrics id))
          (sequence start-idx end-idx)
        )
      )
    )
  )
)

;; Helper function to create time range checker
(define-private (check-time-range-closure (metric {timestamp: uint, tx-count: uint, volume: uint, active-addresses: uint}))
  (let
    (
      (timestamp (get timestamp metric))
    )
    (and 
      (>= timestamp start-time)
      (<= timestamp end-time)
    )
  )
)

(define-private (unwrap-metrics (metric (optional {timestamp: uint, tx-count: uint, volume: uint, active-addresses: uint})))
  (default-to 
    {timestamp: u0, tx-count: u0, volume: u0, active-addresses: u0}
    metric
  )
)
